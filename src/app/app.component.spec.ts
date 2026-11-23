import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AppComponent } from './app.component';
import { appConfig } from './app.config';
import { AuthService } from './core/auth/auth.service';

@Component({
  template: '',
})
class TestRouteComponent {}

describe('AppComponent', () => {
  const authMock = {
    ready: Promise.resolve(),
    user: signal(null),
    initialized: signal(true),
    busy: signal(false),
    error: signal(null),
    signInWithGoogle: jasmine.createSpy('signInWithGoogle'),
    signOut: jasmine.createSpy('signOut'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([{ path: 'login', component: TestRouteComponent }]),
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it(`should have the 'GameRecordHub' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title).toEqual('GameRecordHub');
  });

  it('should render the app shell for guests', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-bar')).not.toBeNull();
    expect(compiled.querySelector('.sign-in-link')?.textContent).toContain('Sign in to save');
  });

  it('hides the application shell on the login page', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/login');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isLoginPage()).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).querySelector('.app-bar')).toBeNull();
  });

  it('provides the application configuration', () => {
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });
});
