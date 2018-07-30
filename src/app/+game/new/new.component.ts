import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Player} from '../../models/Player';
import {Sounds} from '../../../assets/sounds';
import {AngularFireFunctions} from 'angularfire2/functions';
import {PreMatchInfo} from '../../models/PreMatchInfo';
import {PlayerService} from '../../services/player.service';
import {filter} from 'rxjs/operators';
import {GameService} from '../../services/game.service';

@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss']
})
export class NewComponent {

  players: Player[];
  selectedPlayers: Player[] = [];

  loading = false;

  firstPlayerPreMatchInfo: PreMatchInfo;
  secondPlayerPreMatchInfo: PreMatchInfo;

  constructor(private gameService: GameService,
              private functions: AngularFireFunctions,
              public playerService: PlayerService,
              private router: Router) {

    this.playerService.loaded
      .pipe(filter(loaded => loaded))
      .subscribe(v => {
        this.players = this.playerService.players;
      });

  }

  selectPlayer(player: Player, index: number) {
    if (this.isDisabled(player, index)) {
      return;
    }

    if (!this.isSelected(player, index)) {
      if (!this.selectedPlayers[index]) this.playPlayerSlideInSound();
      this.announcePlayerTTS(player, index);
      this.selectedPlayers[index] = player;
    } else {
      this.selectedPlayers[index] = null;
    }


    if (this.allPlayersAreSelected()) {
      const callable = this.functions.httpsCallable('preMatchInfo');
      callable({firstPlayerEloRank: this.selectedPlayers[0].eloRank, secondPlayerEloRank: this.selectedPlayers[1].eloRank}).subscribe(v => {
        console.log(v);

        const firstPlayerId = this.selectedPlayers[0].id;
        const secondPlayerId = this.selectedPlayers[1].id;

        this.firstPlayerPreMatchInfo = v.firstPlayer;
        this.secondPlayerPreMatchInfo = v.secondPlayer;


        const firstPlayerWinsRanking = this.playerService.getRanking({
          [firstPlayerId]: this.firstPlayerPreMatchInfo.eloIfWin,
          [secondPlayerId]: this.secondPlayerPreMatchInfo.eloIfLoss
        });

        const secondPlayerWinsRanking = this.playerService.getRanking({
          [firstPlayerId]: this.firstPlayerPreMatchInfo.eloIfLoss,
          [secondPlayerId]: this.secondPlayerPreMatchInfo.eloIfWin
        });


        this.firstPlayerPreMatchInfo.rankIfWin = this.playerService.getPlaceForPlayer(this.selectedPlayers[0], firstPlayerWinsRanking);
        this.firstPlayerPreMatchInfo.rankIfLoss = this.playerService.getPlaceForPlayer(this.selectedPlayers[0], secondPlayerWinsRanking);

        this.secondPlayerPreMatchInfo.rankIfWin = this.playerService.getPlaceForPlayer(this.selectedPlayers[1], secondPlayerWinsRanking);
        this.secondPlayerPreMatchInfo.rankIfLoss = this.playerService.getPlaceForPlayer(this.selectedPlayers[1], firstPlayerWinsRanking);

      });
    }

  }

  getRankDiff(currentRank: number, futureRank: number) {
    const diff = futureRank - currentRank;
    return Math.min(1, Math.max(-1, diff));
  }

  getDiff(currentElo: number, futureElo: number) {
    return futureElo - currentElo;
  }

  isSelected(player: Player, index: number) {
    return this.selectedPlayers[index] === player;
  }

  isDisabled(player: Player, index: number) {
    return !this.isSelected(player, index) && this.selectedPlayers.some(p => p && p.name === player.name);
  }

  allPlayersAreSelected() {
    return this.selectedPlayers[0] && this.selectedPlayers[1];
  }

  startMatch(): void {
    if (!this.allPlayersAreSelected()) return;

    this.playStartMatchSound();
    this.loading = true;

    const game = {
      firstPlayerId: this.selectedPlayers[0].id,
      secondPlayerId: this.selectedPlayers[1].id,
      firstPlayerName: this.selectedPlayers[0].name,
      secondPlayerName: this.selectedPlayers[1].name,
      firstPlayerScore: 0,
      secondPlayerScore: 0,
      timestamp: new Date().getTime()
    };

    this.gameService.createGame(game).subscribe(docRef => {
      this.router.navigateByUrl('game/score/' + docRef.id);
    });
  }

  playStartMatchSound(): void {
    const audio = new Audio(Sounds.START_MATCH);
    audio.play();
  }

  playPlayerSlideInSound(): void {
    const audio = new Audio(Sounds.PLAYER_SLIDE_IN);
    audio.play();
  }

  announcePlayerTTS(player: Player, index: number): void {
    const utterance = index === 0 ? `${player.name}!` : `versus ${player.name}!`;
    let msg = new SpeechSynthesisUtterance();
    let voices = window.speechSynthesis.getVoices();
    msg.voice = voices[6];
    msg.text = utterance;
    msg.lang = 'es-ES';
    speechSynthesis.speak(msg);
  }

}
