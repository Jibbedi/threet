import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {AngularFireModule} from 'angularfire2';
import {AngularFirestoreModule} from 'angularfire2/firestore';
import {NewComponent} from './+game/new/new.component';
import {RouterModule, Routes} from '@angular/router';
import {ScoreComponent} from './+game/score/score.component';
import {LeaderboardComponent} from './+leaderboard/leaderboard/leaderboard.component';
import {AngularFireFunctionsModule} from 'angularfire2/functions';
import {AdminComponent} from './+admin/leaderboard/admin.component';
import {CreateTournamentComponent} from './+tournament/create-tournament/create-tournament.component';
import {PlayerService} from './services/player.service';
import {KnockoutPhaseTreeComponent} from './+tournament/knockout-phase-tree/knockout-phase-tree.component';
import {TournamentOverviewComponent} from './+tournament/tournament-overview/tournament-overview.component';
import {ProfileComponent} from './+user/profile/profile.component';
import {FormsModule} from '@angular/forms';
import {LeagueViewComponent} from './+tournament/league-view/league-view.component';
import {AngularFireAuthModule} from 'angularfire2/auth';
import {LandingComponent} from './+main/landing/landing.component';
import {HeaderComponent} from './+main/header/header.component';
import {AuthGuard} from './guards/auth.guard';
import {AuthService} from './services/auth.service';
import {GameService} from './services/game.service';


const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'admin',
    component: AdminComponent
  },
  {
    path: 'tournament',
    children: [
      {
        path: 'create',
        component: CreateTournamentComponent
      },
      {
        path: 'overview/:tournamentId',
        component: TournamentOverviewComponent
      },
    ],
    canActivate: [AuthGuard]
  },
  {
    path: 'user',
    children: [
      {
        path: 'profile/:playerId',
        component: ProfileComponent
      }
    ],
    canActivate: [AuthGuard]
  },
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
    ],
    canActivate: [AuthGuard]
  },
  {
    path: 'leaderboard',
    component: LeaderboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/'
  },
];

@NgModule({
  declarations: [
    AppComponent,
    NewComponent,
    ScoreComponent,
    CreateTournamentComponent,
    ProfileComponent,
    HeaderComponent,
    AdminComponent,
    LandingComponent,
    LeaderboardComponent,
    KnockoutPhaseTreeComponent,
    LeagueViewComponent,
    TournamentOverviewComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot(routes),
    AngularFireModule.initializeApp({
      apiKey: 'AIzaSyAWzy8vLLarlAFyx_8nKdT52a5XYAAWUW8',
      authDomain: 'threet-c189b.firebaseapp.com',
      databaseURL: 'https://threet-c189b.firebaseio.com',
      projectId: 'threet-c189b',
      storageBucket: 'threet-c189b.appspot.com',
      messagingSenderId: '1095738527709'
    }),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireFunctionsModule
  ],
  providers: [PlayerService, GameService, AuthService, AuthGuard],
  bootstrap: [AppComponent]
})
export class AppModule {
}
