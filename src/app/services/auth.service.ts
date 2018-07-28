import {Injectable} from '@angular/core';
import {AngularFireAuth} from 'angularfire2/auth';
import {Credentials} from '../models/Credentials';
import {Observable} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {Router} from '@angular/router';

@Injectable()
export class AuthService {


  constructor(private auth: AngularFireAuth, private router: Router) {
    this.auth.authState.subscribe(state => {
      if (!state) {
        this.router.navigate(['/']);
      }
    });
  }

  isUserLoggedIn(): Observable<boolean> {
    return this.auth.authState.pipe(take(1), map(state => !!state));
  }

  signIn(credentials: Credentials): Promise<any> {
    return this.auth.auth.signInWithEmailAndPassword(credentials.email, credentials.password)
      .catch(error => Promise.reject(error.message));
  }

  signUp(credentials: Credentials) {
    return this.auth.auth.createUserWithEmailAndPassword(credentials.email, credentials.password)
      .catch(error => Promise.reject(error.message));
  }

  signOut() {
    this.auth.auth.signOut();
  }
}
