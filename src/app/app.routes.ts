import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './auth.guard';
import { GamesComponent } from './features/games/games.component';
import { HistoryComponent } from './features/history/history.component';
import { LoginComponent } from './features/login/login.component';
import { LostCitiesComponent } from './features/lost-cities/lost-cities.component';
import { SeaSaltPaperComponent } from './features/sea-salt-paper/sea-salt-paper.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'games', component: GamesComponent },
  { path: 'games/lost-cities', component: LostCitiesComponent },
  { path: 'games/sea-salt-paper', component: SeaSaltPaperComponent },
  { path: 'history', component: HistoryComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'games' },
  { path: '**', redirectTo: 'games' },
];
