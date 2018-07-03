import {Component, HostListener} from '@angular/core';
import {AngularFirestore} from 'angularfire2/firestore';
import {ActivatedRoute, Router} from '@angular/router';
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
      if (this.isGameFinished()) return;
      this.game.secondPlayerScore = this.game.secondPlayerScore + 1;
    } else if ($event.code === 'ArrowDown') {
      this.game.secondPlayerScore = Math.max(this.game.secondPlayerScore - 1, 0);
    } else if ($event.code === 'KeyW') {
      if (this.isGameFinished()) return;
      this.game.firstPlayerScore = this.game.firstPlayerScore + 1;
    } else if ($event.code === 'KeyS') {
      this.game.firstPlayerScore = Math.max(this.game.firstPlayerScore - 1, 0);
    }

    !this.isGameFinished() && this.swapActivePlayer();
  }

  constructor(private route: ActivatedRoute, private db: AngularFirestore, private router: Router) {
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
    const {firstPlayerScore, secondPlayerScore} = this.game;
    const reachedWinningPoints = firstPlayerScore >= WINNING_GAME_POINTS || secondPlayerScore >= WINNING_GAME_POINTS;
    const playerHasTwoPointsLead = Math.abs((firstPlayerScore - secondPlayerScore)) >= 2;

    if (!reachedWinningPoints) return false;
    if (reachedWinningPoints && playerHasTwoPointsLead) return true;

    // check for tie
    if ((firstPlayerScore >= WINNING_GAME_POINTS - 1) && (secondPlayerScore >= WINNING_GAME_POINTS - 1)) {
      return playerHasTwoPointsLead;
    } else {
      return false;
    }
  }

  finishGame() {
    if (!this.isGameFinished()) {
      return;
    }
    this.game.timestamp = Date.now();
    this.game.done = true;
    this.db.collection<Game[]>('games').doc<Game>(this.game.gameId).set(this.game);
    this.router.navigateByUrl('leaderboard');
  }
}
