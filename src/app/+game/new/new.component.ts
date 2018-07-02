import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from 'angularfire2/firestore';
import {Observable} from 'rxjs';
import {Player} from '../../models/Player';

@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css']
})
export class NewComponent implements OnInit {

  player$: Observable<Player[]>;
  selectedPlayers: Player[] = [];

  constructor(private db: AngularFirestore) {
    this.player$ = this.db.collection<Player>('players').valueChanges();
  }

  ngOnInit() {
  }

  selectPlayer(player: Player, index: number) {
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

}
