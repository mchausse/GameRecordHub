import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { LocaleSelectComponent } from '../../core/i18n/locale-select.component';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-login',
  imports: [FormsModule, LocaleSelectComponent, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly qa = environment.qa;
  qaEmail = '';
  qaPassword = '';

  async signIn(): Promise<void> {
    await this.auth.signInWithGoogle();
    if (this.auth.user()) await this.router.navigateByUrl('/games');
  }

  async signInToQa(): Promise<void> {
    await this.auth.signInWithQaEmail(this.qaEmail, this.qaPassword);
    if (this.auth.user()) await this.router.navigateByUrl('/games');
  }
}
