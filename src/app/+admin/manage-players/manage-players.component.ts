import {Component, ViewChild} from '@angular/core';
import {PlayerService} from '../../services/player.service';
import {Credentials} from '../../models/Credentials';
import {AuthService} from '../../services/auth.service';
import {NgForm} from '@angular/forms';
import {Player} from '../../models/Player';

@Component({
  selector: 'app-manage-players',
  templateUrl: './manage-players.component.html',
  styleUrls: ['./manage-players.component.scss']
})
export class ManagePlayersComponent {

  @ViewChild(NgForm)
  form: NgForm;

  constructor(public playerService: PlayerService, private authService: AuthService) {
  }

  submitForm(formData: { name: string, credentials: Credentials }) {
    this.authService.signUp(formData.name, formData.credentials).subscribe(user => {
      this.form.reset();
    });
  }

  handleRoleChange(player: Player, role) {
    this.authService.changeRoleOfUser(player.id, role);
  }
}
