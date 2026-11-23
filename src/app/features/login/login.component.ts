import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { LocaleSelectComponent } from '../../core/i18n/locale-select.component';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-login',
  imports: [LocaleSelectComponent, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  async signIn(): Promise<void> {
    await this.auth.signInWithGoogle();
    if (this.auth.user()) await this.router.navigateByUrl('/games');
  }
}
