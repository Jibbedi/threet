import {Component} from '@angular/core';
import {Credentials} from '../../models/Credentials';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {

  error: string;

  constructor(private auth: AuthService, private router: Router) {
  }

  submitForm(credentials: Credentials) {
    this.auth.signIn(credentials)
      .then(success => this.router.navigate(['/leaderboard']))
      .catch(error => {
        this.error = error;
      });
  }
}
