import {Component} from '@angular/core';
import {AngularFirestore} from 'angularfire2/firestore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  players;

  constructor(private db: AngularFirestore) {
    this.players = this.db.collection('players').valueChanges();
  }
}
