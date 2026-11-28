import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let router: jasmine.SpyObj<Router>;
  let user: ReturnType<typeof signal<{ uid: string } | null>>;
  let signInWithGoogle: jasmine.Spy;
  let signInWithQaEmail: jasmine.Spy;

  beforeEach(async () => {
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);
    user = signal<{ uid: string } | null>(null);
    signInWithGoogle = jasmine.createSpy('signInWithGoogle').and.resolveTo();
    signInWithQaEmail = jasmine.createSpy('signInWithQaEmail').and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { user, signInWithGoogle, signInWithQaEmail } },
      ],
    }).compileComponents();
  });

  it('redirects after a successful sign-in', async () => {
    const component = TestBed.createComponent(LoginComponent).componentInstance;
    user.set({ uid: 'user-1' });

    await component.signIn();

    expect(signInWithGoogle).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/games');
  });

  it('stays on the login page when sign-in did not complete', async () => {
    const component = TestBed.createComponent(LoginComponent).componentInstance;

    await component.signIn();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('uses QA email credentials and redirects after sign-in', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.qaEmail = 'qa@example.com';
    component.qaPassword = 'test-password';
    user.set({ uid: 'qa-user' });

    await component.signInToQa();

    expect(signInWithQaEmail).toHaveBeenCalledWith('qa@example.com', 'test-password');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/games');
  });
});
