import {Component, OnInit} from '@angular/core';
import { Router } from "@angular/router";
import {AngularFirestore} from 'angularfire2/firestore';
import {Observable} from 'rxjs';
import {Player} from '../../models/Player';
import { Game } from "../../models/Game";

@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css']
})
export class NewComponent implements OnInit {

  player$: Observable<Player[]>;
  selectedPlayers: Player[] = [];

  showStartMatch = false;
  loading = false;

  constructor(private db: AngularFirestore,
              private router: Router) {
    this.player$ = this.db.collection<Player>('players').valueChanges();
  }

  ngOnInit() {
  }

  selectPlayer(player: Player, index: number) {
    if (this.isDisabled(player, index)) {
      return;
    }

    if (!this.isSelected(player, index)) {
      this.selectedPlayers[index] = player;
    } else {
      this.selectedPlayers[index] = null;
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

    this.loading = true;

    const game = {
      firstPlayerId: this.selectedPlayers[0].name,
      secondPlayerId: this.selectedPlayers[1].name,
      firstPlayerName: this.selectedPlayers[0].name,
      secondPlayerName: this.selectedPlayers[1].name,
      firstPlayerScore: 0,
      secondPlayerScore: 0,
      timestamp: new Date().getTime()
    };

    this.db.collection<Game>('games').add(game as Game).then(docRef => {
      this.router.navigateByUrl('game/score/' + docRef.id);
    });
  }

}
