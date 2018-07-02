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
      this.ranking = players.sort((a, b) => a.winPercentage);
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
    return game.firstPlayerScore > game.secondPlayerScore ? game.firstPlayerId : game.secondPlayerId;
  }

  getLoserName(game: Game) {
    return game.firstPlayerScore > game.secondPlayerScore ? game.secondPlayerId : game.firstPlayerId;
  }

}
