import {Component, HostListener} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Game} from '../../models/Game';
import {WINNING_GAME_POINTS} from '../../constants/config';
import {GameService} from '../../services/game.service';

@Component({
  selector: 'app-score',
  templateUrl: './score.component.html',
  styleUrls: ['./score.component.scss']
})
export class ScoreComponent {

  game: Game;

  activePlayer: string;
  initialActivePlayer: string;
  swappedPlayers: boolean = false;

  tournamentId: string;

  finishButtonMaximized: boolean = true;

  @HostListener('document:keydown', ['$event'])
  handleKeyDown($event: KeyboardEvent) {

    if (!this.activePlayer) {
      return;
    }

    const firstPlayer: number = !this.swappedPlayers ? 1 : 2;
    const secondPlayer: number = !this.swappedPlayers ? 2 : 1;

    if ($event.code === 'ArrowUp') {
      this.scoreUpPlayer(secondPlayer);
    } else if ($event.code === 'ArrowDown') {
      this.scoreDownPlayer(2);
    } else if ($event.code === 'KeyW') {
      this.scoreUpPlayer(firstPlayer);
    } else if ($event.code === 'KeyS') {
      this.scoreDownPlayer(firstPlayer);
    }
  }

  constructor(private route: ActivatedRoute, private gameService: GameService, private router: Router) {
    this.route.queryParams.subscribe(queryParams => {
      this.tournamentId = queryParams.tournamentId;
    });

    this.route.params.subscribe(params => {
      const {gameId} = params;
      this.gameService.getGameForId(gameId).then(game => {
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

  scoreUpPlayer(player: number) {
    if (this.isGameFinished()) return;

    player === 1
      ? this.game.firstPlayerScore += 1
      : this.game.secondPlayerScore += 1;

    !this.isGameFinished() && this.calculateActivePlayer();
  }

  scoreDownPlayer(player: number) {
    player === 1
      ? this.game.firstPlayerScore = Math.max(this.game.firstPlayerScore - 1, 0)
      : this.game.secondPlayerScore = Math.max(this.game.secondPlayerScore - 1, 0);

    !this.isGameFinished() && this.calculateActivePlayer();
  }

  calculateActivePlayer() {
    const totalPoints = this.game.secondPlayerScore + this.game.firstPlayerScore;
    const oppositePlayer = this.initialActivePlayer === this.game.firstPlayerId ? this.game.secondPlayerId : this.game.firstPlayerId;

    if (this.isOverTime()) {
      this.activePlayer = totalPoints % 2 === 0 ? this.initialActivePlayer : oppositePlayer;
      return;
    }

    const serviceChanges = Math.floor(totalPoints / 2);
    this.activePlayer = serviceChanges % 2 === 0 ? this.initialActivePlayer : oppositePlayer;
  }

  setToActive(playerId: string) {

    if (!this.game.startTimestamp) {
      this.game.startTimestamp = Date.now();
    }

    if (this.pointsHaveBeenMade()) {
      return;
    }

    this.activePlayer = playerId;
    this.initialActivePlayer = playerId;
  }


  isOverTime(): boolean {
    return this.game.secondPlayerScore >= WINNING_GAME_POINTS || this.game.firstPlayerScore >= WINNING_GAME_POINTS;
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

    this.gameService.saveGame(this.game).then(_ => {
      if (!this.tournamentId) {
        this.router.navigateByUrl('leaderboard');
      } else {
        this.router.navigate(['tournament', 'overview', this.tournamentId]);
      }
    });

  }

  getFinishedGameStats() {
    const {firstPlayerScore, secondPlayerScore, firstPlayerName, secondPlayerName} = this.game;
    const firstPlayerWon = firstPlayerScore > secondPlayerScore;

    return {
      winner: {
        name: firstPlayerWon ? firstPlayerName : secondPlayerName,
        score: firstPlayerWon ? firstPlayerScore : secondPlayerScore
      },
      loser: {
        name: firstPlayerWon ? secondPlayerName : firstPlayerName,
        score: firstPlayerWon ? secondPlayerScore : firstPlayerScore
      }
    };
  }

  private pointsHaveBeenMade(): boolean {
    const {firstPlayerScore, secondPlayerScore} = this.game;
    return firstPlayerScore + secondPlayerScore > 0;
  }
}
