import {Component, HostListener} from '@angular/core';
import {AngularFirestore} from 'angularfire2/firestore';
import {ActivatedRoute} from '@angular/router';
import {Game} from '../../models/Game';
import {WINNING_GAME_POINTS} from '../../constants/config';
import {Observable} from 'rxjs';
import {Player} from '../../models/Player';

@Component({
  selector: 'app-score',
  templateUrl: './score.component.html',
  styleUrls: ['./score.component.css']
})
export class ScoreComponent {

  game: Game;

  activePlayer: string;

  firstPlayer: Observable<Player>;
  secondPlayer: Observable<Player>;

  @HostListener('document:keydown', ['$event'])
  handleKeydown($event: KeyboardEvent) {

    if (!this.activePlayer) {
      return;
    }

    if ($event.code === 'ArrowUp') {
      this.game.secondPlayerScore = Math.min(this.game.secondPlayerScore + 1, WINNING_GAME_POINTS);
    } else if ($event.code === 'ArrowDown') {
      this.game.secondPlayerScore = Math.max(this.game.secondPlayerScore - 1, 0);
    } else if ($event.code === 'KeyW') {
      this.game.firstPlayerScore = Math.min(this.game.firstPlayerScore + 1, WINNING_GAME_POINTS);
    } else if ($event.code === 'KeyS') {
      this.game.firstPlayerScore = Math.max(this.game.firstPlayerScore - 1, 0);
    }

    !this.isGameFinished() && this.swapActivePlayer();
  }

  constructor(private route: ActivatedRoute, private db: AngularFirestore) {
    this.route.params.subscribe(params => {
      const {gameId} = params;
      this.db.collection<Game[]>('games').doc<Game>(gameId).valueChanges().subscribe(game => {
        game.gameId = gameId;
        this.firstPlayer = this.db.collection('players').doc<Player>(game.firstPlayerId).valueChanges();
        this.secondPlayer = this.db.collection('players').doc<Player>(game.secondPlayerId).valueChanges();
        this.game = game;
      });
    });
  }

  isActivePlayer(playerId: string) {
    return playerId === this.activePlayer;
  }

  swapActivePlayer() {
    if ((this.game.secondPlayerScore + this.game.firstPlayerScore) % 2 === 0) {
      this.activePlayer = this.game.firstPlayerId === this.activePlayer ? this.game.secondPlayerId : this.game.firstPlayerId;
    }
  }

  setToActive(playerId: string) {
    this.activePlayer = playerId;
  }

  isGameFinished() {
    return this.game.firstPlayerScore === WINNING_GAME_POINTS || this.game.secondPlayerScore === WINNING_GAME_POINTS;
  }

  finishGame() {
    if (!this.isGameFinished()) {
      return;
    }
    this.game.timestamp = Date.now();
    this.db.collection<Game[]>('games').doc<Game>(this.game.gameId).set(this.game);
  }
}
