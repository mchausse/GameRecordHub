import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './core/auth/auth.service';

describe('route guards', () => {
  const user = signal<{ uid: string } | null>(null);
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    user.set(null);
    router = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    router.createUrlTree.and.callFake((commands) => ({ commands } as unknown as UrlTree));
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        {
          provide: AuthService,
          useValue: { ready: Promise.resolve(), user: user.asReadonly() },
        },
      ],
    });
  });

  it('redirects signed-out users away from protected routes', async () => {
    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toEqual({ commands: ['/login'] } as unknown as UrlTree);
  });

  it('allows signed-in users into protected routes', async () => {
    user.set({ uid: 'user-1' });
    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBeTrue();
  });

  it('redirects signed-in guests away from login', async () => {
    user.set({ uid: 'user-1' });
    const result = await TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(result).toEqual({ commands: ['/games'] } as unknown as UrlTree);
  });

  it('allows signed-out guests into login', async () => {
    const result = await TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(result).toBeTrue();
  });
});
