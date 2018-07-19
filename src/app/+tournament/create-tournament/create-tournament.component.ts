import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {PlayerService} from '../../services/player.service';
import {Player} from '../../models/Player';
import {AngularFirestore} from 'angularfire2/firestore';
import {STAGE} from '../../constants/config';
import {Tournament} from '../../models/Tournament';

@Component({
  selector: 'app-create-tournament',
  templateUrl: './create-tournament.component.html',
  styleUrls: ['./create-tournament.component.scss']
})
export class CreateTournamentComponent {

  participatingPlayers: Player[] = [];


  constructor(public playerService: PlayerService,
              private db: AngularFirestore,
              private router: Router) {
  }

  createTournament() {
    this.db.collection<Tournament>(STAGE + 'tournaments').add({
      participantsIds: this.participatingPlayers.map(player => player.id),
      timestamp: Date.now(),
      stakePerPlayer: 10,
      splitPercentages: [90, 10],
      mode: 'knockout',
      done: false,
      shouldEffectElo: false,
      shouldEffectRank: false
    }).then(tournament => {
      this.router.navigate(['tournament', 'overview', tournament.id]);
    });
  }

  selectPlayer(player: Player): void {
    if (this.participatingPlayers.includes(player)) {
      this.participatingPlayers = this.participatingPlayers.filter(participatingPlayer => participatingPlayer !== player);
    } else {
      this.participatingPlayers = [...this.participatingPlayers, player];
    }
  }

  isSelected(player): boolean {
    return this.participatingPlayers.includes(player);
  }

  isNumberOfPlayersValid() {
    return Math.log2(this.participatingPlayers.length) % 1 === 0 && this.participatingPlayers.length >= 4;
  }
}
