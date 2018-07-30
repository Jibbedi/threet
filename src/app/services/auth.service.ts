import {Injectable} from '@angular/core';
import {AngularFireAuth} from 'angularfire2/auth';
import {Credentials} from '../models/Credentials';
import {Observable, of} from 'rxjs';
import {map, switchMap, take} from 'rxjs/operators';
import {Router} from '@angular/router';
import {Player} from '../models/Player';
import {AngularFirestore} from 'angularfire2/firestore';
import {STAGE} from '../constants/config';
import {AngularFireFunctions} from 'angularfire2/functions';

@Injectable()
export class AuthService {

  user: Player;
  userDidSignIn = false;


  constructor(private auth: AngularFireAuth,
              private db: AngularFirestore,
              private functions: AngularFireFunctions,
              private router: Router) {
    this.getPlayerDataForAuthState()
      .subscribe((player: Player) => {
        if (!player) {
          this.router.navigate(['/']);
        } else if (this.userDidSignIn) {
          this.router.navigate(['/user', 'profile', player.id]);
        }
        this.user = player;
      });
  }

  changeRoleOfUser(userId: string, role) {
    this.db.collection<Player>(STAGE + 'players').doc(userId).update({role});
  }

  isUserLoggedIn(): Observable<boolean> {
    return this.getPlayerDataForAuthState().pipe(take(1), map(user => !!user));
  }

  signIn(credentials: Credentials): Promise<any> {
    return this.auth.auth.signInWithEmailAndPassword(credentials.email, credentials.password)
      .then(_ => this.userDidSignIn = true)
      .catch(error => Promise.reject(error.message));
  }

  signUp(name: string, credentials: Credentials): Observable<any> {
    const callable = this.functions.httpsCallable('createUser');
    return callable({name, email: credentials.email, password: credentials.password, teamId: this.user.teamId, stage: STAGE});
  }

  signOut() {
    this.auth.auth.signOut();
  }

  getPlayerDataForAuthState(): Observable<Player> {

    if (this.user) {
      return of(this.user);
    }

    return this.auth.authState
      .pipe(
        switchMap(authState => {

          if (!authState) {
            return of(null);
          }

          return this.db.collection<Player>(STAGE + 'players').doc(authState.uid)
            .ref
            .get()
            .then(snapshot => snapshot.data());

        })
      );
  }
}
