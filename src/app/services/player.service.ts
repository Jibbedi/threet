import {Injectable} from '@angular/core';
import {Player} from '../models/Player';
import {STAGE} from '../constants/config';
import {AngularFirestore} from 'angularfire2/firestore';
import {BehaviorSubject} from 'rxjs';
import {AuthService} from './auth.service';
import {switchMap, take} from 'rxjs/operators';

@Injectable()
export class PlayerService {

  players: Player[];

  loaded = new BehaviorSubject(false);

  constructor(private db: AngularFirestore, private auth: AuthService) {

    this.auth.getPlayerDataForAuthState()
      .pipe(
        take(1),
        switchMap(player => this.db.collection<Player>(STAGE + 'players', ref => ref.where('teamId', '==', player.teamId).where('archived', '!=', false)).valueChanges())
      )
      .subscribe(players => {
        this.players = players;
        this.loaded.next(true);
      });
  }

  getRanking(overrideElosForIds?: { [id: string]: number }): Player[] {
    return this.players.filter(player => player.totalWins > 0 || player.totalLoses > 0).map(player => {

      const overrideElo = overrideElosForIds ? overrideElosForIds[player.id] : null;

      if (overrideElo) {
        return {...player, eloRank: overrideElo};
      } else {
        return {...player, eloRank: player.eloRank || 1000};
      }

    }).sort((a, b) => a.eloRank > b.eloRank ? -1 : a.eloRank === b.eloRank ? 0 : 1);
  }

  getPlaceForPlayer(player: Player, ranking: Player[] = this.getRanking()) {
    return ranking.findIndex(playerInRanking => playerInRanking.id === player.id) + 1;
  }
}
