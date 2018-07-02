import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {AngularFireModule} from 'angularfire2';
import {AngularFirestoreModule} from 'angularfire2/firestore';
import {NewComponent} from './+game/new/new.component';
import {RouterModule, Routes} from '@angular/router';
import {ScoreComponent} from './+game/score/score.component';
import {LeaderboardComponent} from './+leaderboard/leaderboard/leaderboard.component';


const routes: Routes = [
  {
    path: 'game',
    children: [
      {
        path: 'new',
        component: NewComponent
      },
      {
        path: 'score/:gameId',
        component: ScoreComponent
      }
    ]
  },
  {
    path: 'leaderboard',
    component: LeaderboardComponent
  }
];

@NgModule({
  declarations: [
    AppComponent,
    NewComponent,
    ScoreComponent,
    LeaderboardComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    AngularFireModule.initializeApp({
      apiKey: 'AIzaSyAWzy8vLLarlAFyx_8nKdT52a5XYAAWUW8',
      authDomain: 'threet-c189b.firebaseapp.com',
      databaseURL: 'https://threet-c189b.firebaseio.com',
      projectId: 'threet-c189b',
      storageBucket: 'threet-c189b.appspot.com',
      messagingSenderId: '1095738527709'
    }),
    AngularFirestoreModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
