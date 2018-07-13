import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {AngularFirestore} from 'angularfire2/firestore';
import {Observable} from 'rxjs';
import {Player} from '../../models/Player';
import {Game} from '../../models/Game';
import {Sounds} from '../../../assets/sounds';
import {AngularFireFunctions} from 'angularfire2/functions';
import {STAGE} from '../../constants/config';

@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css']
})
export class NewComponent {

  player$: Observable<Player[]>;
  selectedPlayers: Player[] = [];

  showStartMatch = false;
  loading = false;

  expectedWinFirstPlayer: number;
  expectedWinSecondPlayer: number;

  constructor(private db: AngularFirestore,
              private functions: AngularFireFunctions,
              private router: Router) {
    this.player$ = this.db.collection<Player>(STAGE + 'players').valueChanges();
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
        this.expectedWinFirstPlayer = v.expectedWinFirstPlayer;
        this.expectedWinSecondPlayer = v.expectedWinSecondPlayer;
      });
    }

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

    this.db.collection<Game>(STAGE + 'games').add(game as Game).then(docRef => {
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
