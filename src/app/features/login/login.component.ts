import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
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
