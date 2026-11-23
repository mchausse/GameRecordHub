import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';
import { AuthService } from './core/auth/auth.service';

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
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
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
});
