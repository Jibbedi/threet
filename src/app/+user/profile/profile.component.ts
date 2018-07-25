import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {AngularFirestore} from 'angularfire2/firestore';
import {Player} from '../../models/Player';
import {PlayerService} from '../../services/player.service';
import {ActivatedRoute} from '@angular/router';
import {filter, map, skip, switchMap, take} from 'rxjs/operators';
import {Game} from '../../models/Game';
import {STAGE} from '../../constants/config';
import {combineLatest} from 'rxjs';


declare const Chart;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements AfterViewInit {

  player: Player;

  playerGames: Game[];

  @ViewChild('winLoseChart')
  winLoseChart: ElementRef;

  @ViewChild('scoreChart')
  scoreChart: ElementRef;

  @ViewChild('historyChart')
  historyChart: ElementRef;

  historyWidth: number;

  opponentMap = [];
  favoriteOpponent: { name: string, wins: number, id: string };
  leastFavoriteOpponent: { name: string, loses: number, id: string };
  mostPlayedAgainst: { name: string, wins: number, loses: number, id: string };

  rank: number;

  constructor(private db: AngularFirestore, private playerService: PlayerService, private route: ActivatedRoute) {
  }

  ngAfterViewInit() {

    this.route.params.pipe(skip(1)).subscribe(v => window.location.reload());

    this.playerService.loaded
      .pipe(
        filter(loaded => loaded),
        switchMap(data => this.route.params),
        map(params => params.playerId),
        take(1)
      ).subscribe(playerId => {
        this.player = this.playerService.players.find(player => player.id === playerId);


        this.rank = this.playerService.players
          .filter(player => player.totalWins > 0 || player.totalLoses > 0)
          .sort((a, b) => b.eloRank - a.eloRank)
          .indexOf(this.player) + 1;

        const whereFirstPlayer = this.db.collection<Game>(STAGE + 'games', ref => ref.where('firstPlayerId', '==', playerId)).valueChanges();
        const whereSecondPlayer = this.db.collection<Game>(STAGE + 'games', ref => ref.where('secondPlayerId', '==', playerId)).valueChanges();

        combineLatest(whereFirstPlayer, whereSecondPlayer).pipe(take(1)).subscribe(games => {
          this.playerGames = [...games[0], ...games[1]]
            .filter(game => game.done)
            .sort((a, b) => a.timestamp - b.timestamp);


          this.historyWidth = this.playerGames.length * 50;

          setTimeout(() => {
            this.drawHistoryChart();
          });

          this.opponentMap = this.createOpponentMap();
          this.favoriteOpponent = this.opponentMap.sort((a, b) => b.wins - a.wins)[0];
          this.leastFavoriteOpponent = this.opponentMap.sort((a, b) => b.loses - a.loses)[0];
          this.mostPlayedAgainst = this.opponentMap.sort((a, b) => (b.loses + b.wins) - (a.loses + a.wins))[0];

        });

        setTimeout(() => {
          this.drawWinLoseChart();
          this.drawScoreChart();
        });
      }
    );
  }


  private createOpponentMap() {
    const playerMap = this.playerGames.reduce((acc, game) => {
      const opponent = this.getOpponentName(game);

      if (!acc[opponent]) {
        acc[opponent] = {name: opponent, id: this.getOpponentId(game), wins: 0, loses: 0, scoreFor: 0, scoreAgainst: 0};
      }

      acc[opponent].wins += this.playerHasWon(game) ? 1 : 0;
      acc[opponent].loses += !this.playerHasWon(game) ? 1 : 0;
      acc[opponent].scoreFor += this.getPlayerScore(game);
      acc[opponent].scoreAgainst += this.getOpponentScore(game);

      return acc;

    }, {} as any);


    return Object.values(playerMap);
  }

  getPercentage(opponent) {
    return Math.round(opponent.wins / (opponent.wins + opponent.loses) * 100);
  }

  private drawWinLoseChart() {
    new Chart(this.winLoseChart.nativeElement.getContext('2d'), {
      type: 'pie',
      data: {
        datasets: [{
          data: [this.player.totalWins, this.player.totalLoses],
          backgroundColor: ['#64b39e', '#d63031'],
        }],

        // These labels appear in the legend and in the tooltips when hovering different arcs
        labels: [
          'Wins',
          'Losses'
        ]
      },
      options: {
        maintainAspectRatio: false,
      }
    });
  }

  private drawScoreChart() {
    new Chart(this.scoreChart.nativeElement.getContext('2d'), {
      type: 'bar',
      data: {
        datasets: [{
          data: [this.player.totalScoreFor, this.player.totalScoreAgainst],
          backgroundColor: ['#64b39e', '#d63031'],
        }],

        // These labels appear in the legend and in the tooltips when hovering different arcs
        labels: [
          'Score For',
          'Score Against'
        ]
      },
      options: {
        legend: {display: false},
        maintainAspectRatio: false,
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });
  }

  private drawHistoryChart() {
    new Chart(this.historyChart.nativeElement.getContext('2d'), {
      type: 'line',
      data: {
        labels: this.playerGames.map((game, index) => 'vs ' + (this.playerIsFirstPlayer(game) ? game.secondPlayerName : game.firstPlayerName)),
        datasets: [{
          data: this.playerGames.map(game => this.getPlayerScore(game)),
          label: 'Scores For',
          borderColor: '#64b39e',
        },
          {
            data: this.playerGames.map(game => this.getOpponentScore(game)),
            label: 'Scores Against',
            borderColor: '#d63031',
          }],
      },
      options: {
        legend: {display: false},
        maintainAspectRatio: false,
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });
  }

  private playerIsFirstPlayer(game: Game) {
    return game.firstPlayerId === this.player.id;
  }

  private getPlayerScore(game: Game) {
    return this.playerIsFirstPlayer(game) ? game.firstPlayerScore : game.secondPlayerScore;
  }

  private getOpponentScore(game: Game) {
    return this.playerIsFirstPlayer(game) ? game.secondPlayerScore : game.firstPlayerScore;
  }

  private getOpponentName(game: Game) {
    return this.playerIsFirstPlayer(game) ? game.secondPlayerName : game.firstPlayerName;
  }

  private getOpponentId(game: Game) {
    return this.playerIsFirstPlayer(game) ? game.secondPlayerId : game.firstPlayerId;
  }

  private playerHasWon(game: Game) {
    return this.getPlayerScore(game) > this.getOpponentScore(game);
  }
}
