import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {PlayerService} from '../../services/player.service';
import {Player} from '../../models/Player';
import {AngularFirestore} from 'angularfire2/firestore';
import {STAGE} from '../../constants/config';
import {AngularFireFunctions} from 'angularfire2/functions';

@Component({
  selector: 'app-create-tournament',
  templateUrl: './create-tournament.component.html',
  styleUrls: ['./create-tournament.component.scss']
})
export class CreateTournamentComponent {

  participatingPlayers: Player[] = [];

  type: 'knockout' | 'league' = 'knockout';

  stake = 10;

  splitPercentages = [60, 30, 10];

  loading = false;


  constructor(public playerService: PlayerService,
              private db: AngularFirestore,
              private functions: AngularFireFunctions,
              private router: Router) {
  }

  createTournament() {

    this.loading = true;

    const tournamentFunctionName = this.type === 'knockout' ? 'createKnockoutTournamentFunction' : 'createLeagueTournamentFunction';


    const callable = this.functions.httpsCallable(tournamentFunctionName);

    callable({
      tournament: {
        participantsIds: this.participatingPlayers.map(player => player.id),
        timestamp: Date.now(),
        stakePerPlayer: this.stake,
        splitPercentages: this.splitPercentages,
        mode: this.type,
        done: false,
        shouldEffectElo: false,
        shouldEffectRank: true
      },
      stage: STAGE
    }).subscribe(tournamentId => {
      this.loading = false;
      this.router.navigate(['tournament', 'overview', tournamentId]);
    });
  }

  selectPlayer(player: Player): void {
    if (this.participatingPlayers.includes(player)) {
      this.participatingPlayers = this.participatingPlayers.filter(participatingPlayer => participatingPlayer !== player);
      this.splitPercentages.pop();
    } else {
      this.participatingPlayers = [...this.participatingPlayers, player];
      this.splitPercentages.push(0);
    }


  }

  isSelected(player): boolean {
    return this.participatingPlayers.includes(player);
  }

  isNumberOfPlayersValid() {
    return this.type === 'knockout' ?
      Math.log2(this.participatingPlayers.length) % 1 === 0 && this.participatingPlayers.length >= 4 :
      this.participatingPlayers.length >= 4;
  }

  isPercentageValid() {
    return this.splitPercentages.reduce((sum, percentage) => sum + percentage, 0) === 100;
  }

  setType(type: 'knockout' | 'league') {
    this.type = type;
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}
