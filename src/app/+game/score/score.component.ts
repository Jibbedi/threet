import {Component, HostListener} from '@angular/core';
import {AngularFirestore} from 'angularfire2/firestore';
import {ActivatedRoute, Router} from '@angular/router';
import {Game} from '../../models/Game';
import {STAGE, WINNING_GAME_POINTS} from '../../constants/config';

@Component({
  selector: 'app-score',
  templateUrl: './score.component.html',
  styleUrls: ['./score.component.css']
})
export class ScoreComponent {

  game: Game;

  activePlayer: string;
  initialActivePlayer: string;

  tournamentId: string;

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

    !this.isGameFinished() && this.calculateActivePlayer();
  }

  constructor(private route: ActivatedRoute, private db: AngularFirestore, private router: Router) {
    this.route.queryParams.subscribe(queryParams => {
      this.tournamentId = queryParams.tournamentId;
    });

    this.route.params.subscribe(params => {
      const {gameId} = params;
      this.db.collection<Game[]>(STAGE + 'games').doc<Game>(gameId).valueChanges().subscribe(game => {
        game.gameId = gameId;
        this.game = game;
        this.game.firstPlayerScore = this.game.firstPlayerScore || 0;
        this.game.secondPlayerScore = this.game.secondPlayerScore || 0;
      });
    });
  }

  isActivePlayer(playerId: string) {
    return playerId === this.activePlayer;
  }

  calculateActivePlayer() {
    const totalPoints = this.game.secondPlayerScore + this.game.firstPlayerScore;
    const serviceChanges = Math.floor(totalPoints / 2);
    this.activePlayer = serviceChanges % 2 === 0 ? this.initialActivePlayer : (this.initialActivePlayer === this.game.firstPlayerId ? this.game.secondPlayerId : this.game.firstPlayerId);
  }

  setToActive(playerId: string) {
    this.activePlayer = playerId;
    this.initialActivePlayer = playerId;
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
    this.db.collection<Game[]>(STAGE + 'games').doc<Game>(this.game.gameId).set(this.game);

    if (!this.tournamentId) {
      this.router.navigateByUrl('leaderboard');
    } else {
      this.router.navigate(['tournament', 'overview', this.tournamentId]);
    }

  }
}
