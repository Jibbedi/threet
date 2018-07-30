import {Component} from '@angular/core';
import {Credentials} from '../../models/Credentials';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

  constructor(public auth: AuthService) {
  }

  signOut() {
    this.auth.signOut();
  }
}
