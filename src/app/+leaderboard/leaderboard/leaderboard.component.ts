import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from 'angularfire2/firestore';
import {Observable} from 'rxjs';
import {Game} from '../../models/Game';
import {Player} from '../../models/Player';
import timeago from 'timeago.js';
import {STAGE} from '../../constants/config';
import {Router} from '@angular/router';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {

  games$: Observable<Game[]>;

  ranking: Player[] = [];

  longestSteakPlayer: Player;
  longestDroughtPlayer: Player;
  longestCurrentStreakPlayer: Player;
  longestCurrentDroughtPlayer: Player;

  constructor(private db: AngularFirestore, private router: Router) {
    this.games$ = this.db.collection<Game>(STAGE + 'games', ref => ref.where('done', '==', true).orderBy('timestamp', 'desc').limit(20)).valueChanges();
    this.db.collection<Player>(STAGE + 'players').valueChanges().subscribe(players => {


      this.longestSteakPlayer = players.filter(player => !!player.longestPositiveStreak).sort((a, b) => a.longestPositiveStreak > b.longestPositiveStreak ? -1 : a.longestPositiveStreak === b.longestPositiveStreak ? 0 : 1)[0];
      this.longestCurrentStreakPlayer = players.filter(player => !!player.streak).sort((a, b) => a.streak > b.streak ? -1 : a.streak === b.streak ? 0 : 1)[0];
      this.longestCurrentDroughtPlayer = players.filter(player => !!player.streak).sort((a, b) => a.streak < b.streak ? -1 : a.streak === b.streak ? 0 : 1)[0];
      this.longestDroughtPlayer = players.filter(player => !!player.longestNegativeStreak).sort((a, b) => a.longestNegativeStreak < b.longestNegativeStreak ? -1 : a.longestNegativeStreak === b.longestNegativeStreak ? 0 : 1)[0];

      this.ranking = players.filter(player => player.totalWins > 0 || player.totalLoses > 0).map(player => {
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

  getWinnerId(game: Game) {
    return game.firstPlayerScore > game.secondPlayerScore ? game.firstPlayerId : game.secondPlayerId;
  }

  getLoserName(game: Game) {
    return game.firstPlayerScore > game.secondPlayerScore ? game.secondPlayerName : game.firstPlayerName;
  }

  getLoserId(game: Game) {
    return game.firstPlayerScore > game.secondPlayerScore ? game.secondPlayerId : game.firstPlayerId;
  }

  getPercentage(percentage: number) {
    return percentage ? Math.round(percentage * 100) : null;
  }

  getTotalGames(player: Player) {
    const totalGames = player.totalWins + player.totalLoses;
    return Number.isNaN(totalGames) ? null : totalGames;
  }

  getTimeAgo(game: Game) {
    return timeago().format(game.timestamp);
  }

  newGame() {
    this.router.navigateByUrl('game/new');
  }
}
