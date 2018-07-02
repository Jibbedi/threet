import {Component, OnInit} from '@angular/core';
import {AngularFirestore} from 'angularfire2/firestore';
import {Observable} from 'rxjs';
import {Game} from '../../models/Game';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit {

  games$: Observable<Game[]>;

  constructor(private db: AngularFirestore) {
    this.games$ = this.db.collection<Game>('games', ref => ref.orderBy('timestamp', 'desc')).valueChanges();
  }

  ngOnInit() {
  }


}
