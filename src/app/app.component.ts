import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from './core/auth/auth.service';
import { LocaleSelectComponent } from './core/i18n/locale-select.component';
import { TranslatePipe } from './core/i18n/translate.pipe';

@Component({
  selector: 'app-root',
  imports: [LocaleSelectComponent, RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);
  readonly title = 'GameRecordHub';
  readonly auth = inject(AuthService);

  isLoginPage(): boolean {
    return this.router.url === '/login';
  }

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe();
  }
}
