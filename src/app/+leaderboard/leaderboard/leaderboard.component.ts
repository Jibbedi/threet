import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from 'angularfire2/firestore';
import {Observable} from 'rxjs';
import {Game} from '../../models/Game';
import {Player} from '../../models/Player';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit {

  games$: Observable<Game[]>;

  ranking: Player[] = [];

  constructor(private db: AngularFirestore) {
    this.games$ = this.db.collection<Game>('games', ref => ref.where('done', '==', true).orderBy('timestamp', 'desc').limit(20)).valueChanges();
    this.db.collection<Player>('players').valueChanges().subscribe(players => {
      this.ranking = players.map(player => {
        return {...player, eloRank: player.eloRank || 1000};
      }).sort((a, b) => a.eloRank > b.eloRank ? -1 : a.eloRank === b.eloRank ? 0 : 1);
    });

  }

  ngOnInit() {
  }

  getWinnerScore(game: Game) {
    return Math.max(game.firstPlayerScore, game.secondPlayerScore);
  }

  getLoserScore(game: Game) {
    return Math.min(game.firstPlayerScore, game.secondPlayerScore);
  }

  getWinnerName(game: Game) {
    return game.firstPlayerScore > game.secondPlayerScore ? game.firstPlayerName : game.secondPlayerName;
  }

  getLoserName(game: Game) {
    return game.firstPlayerScore > game.secondPlayerScore ? game.secondPlayerName : game.firstPlayerName;
  }

  getPercentage(percentage: number) {
    return percentage ? Math.round(percentage * 100) : null;
  }

  getTotalGames(player: Player) {
    const totalGames = player.totalWins + player.totalLoses;
    return Number.isNaN(totalGames) ? null : totalGames;
  }
}
