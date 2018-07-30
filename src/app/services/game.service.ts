import {Injectable} from '@angular/core';
import {STAGE} from '../constants/config';
import {AngularFirestore} from 'angularfire2/firestore';
import {BehaviorSubject, combineLatest} from 'rxjs';
import {AuthService} from './auth.service';
import {map, switchMap, take} from 'rxjs/operators';
import {Game} from '../models/Game';
import {Player} from '../models/Player';

@Injectable()
export class GameService {

  recentGames: Game[];

  loaded = new BehaviorSubject(false);

  constructor(private db: AngularFirestore, private auth: AuthService) {

    this.auth.getPlayerDataForAuthState()
      .pipe(
        take(1),
        switchMap(player => this.db.collection<Game>(STAGE + 'games', ref => ref
          .where('teamId', '==', player.teamId)
          .where('done', '==', true)
          .orderBy('timestamp', 'desc')
          .limit(20))
          .valueChanges())
      )
      .subscribe(games => {
        this.recentGames = games;
        this.loaded.next(true);
      });
  }

  getAllGamesForPlayer(player: Player) {
    return combineLatest(
      this.getGamesForPlayerWhere(player, 'firstPlayerId'),
      this.getGamesForPlayerWhere(player, 'secondPlayerId'),
    ).pipe(
      map(games => [...games[0], ...games[1]]
        .sort((a, b) => a.timestamp - b.timestamp))
    );
  }

  createGame(game: Partial<Game>) {
    return this.auth.getPlayerDataForAuthState()
      .pipe(
        take(1),
        switchMap(playerData => {
          game.teamId = playerData.teamId;
          return this.db.collection<Game>(STAGE + 'games').add(game as Game);
        })
      );
  }

  saveGame(game: Game): Promise<void> {
    return this.getGameRefForId(game.gameId)
      .set(game);
  }

  getGameForId(id: string): Promise<Game> {
    return this.getGameRefForId(id)
      .get()
      .then(gameSnapshot => gameSnapshot.data() as Game);
  }

  private getGameRefForId(id: string) {
    return this.db.collection<Game[]>(STAGE + 'games')
      .doc<Game>(id)
      .ref;
  }

  private getGamesForPlayerWhere(player: Player, where: string) {
    return this.db.collection<Game>(STAGE + 'games', ref => ref.where(where, '==', player.id).where('done', '==', true).where('teamId', '==', player.teamId)).valueChanges();
  }
}
