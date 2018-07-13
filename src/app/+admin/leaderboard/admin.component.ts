import {Component} from '@angular/core';
import {AngularFireFunctions} from 'angularfire2/functions';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent {


  constructor(private functions: AngularFireFunctions) {
  }

  cloneTo(where: string) {
    const moveTo = this.functions.httpsCallable('moveTo');
    moveTo(where).subscribe(v => {
      console.log(v);
    });
  }
}
