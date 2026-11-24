import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { User } from 'firebase/auth';

import { firebaseAuthApi, firebaseFirestoreApi } from '../firebase/firebase';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let router: jasmine.SpyObj<Router>;
  let authStateCallback: (user: User | null) => void;
  const user = {
    uid: 'user-1',
    displayName: 'Ada',
    email: 'ada@example.com',
    photoURL: 'https://example.com/ada.png',
  } as User;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);
    spyOn(firebaseAuthApi, 'onAuthStateChanged').and.callFake((_auth, callback) => {
      if (typeof callback !== 'function') throw new Error('Expected an auth-state callback.');
      authStateCallback = callback;
      return () => undefined;
    });
    spyOn(firebaseAuthApi, 'signInWithPopup');
    spyOn(firebaseAuthApi, 'signInWithEmailAndPassword');
    spyOn(firebaseAuthApi, 'signOut');
    spyOn(firebaseFirestoreApi, 'doc').and.returnValue({} as never);
    spyOn(firebaseFirestoreApi, 'getDoc');
    spyOn(firebaseFirestoreApi, 'setDoc').and.resolveTo();
    spyOn(firebaseFirestoreApi, 'updateDoc').and.resolveTo();
    spyOn(firebaseFirestoreApi, 'serverTimestamp').and.returnValue({ timestamp: true } as never);

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: Router, useValue: router }],
    });
  });

  it('tracks authentication restoration', async () => {
    const service = TestBed.inject(AuthService);
    const promise = service.ready;
    expect(service.initialized()).toBeFalse();

    authStateCallback(user);
    await promise;

    expect(service.user()).toBe(user);
    expect(service.initialized()).toBeTrue();
  });

  it('signs in and updates an existing profile', async () => {
    const service = TestBed.inject(AuthService);
    (firebaseAuthApi.signInWithPopup as jasmine.Spy).and.resolveTo({ user });
    (firebaseFirestoreApi.getDoc as jasmine.Spy).and.resolveTo({ exists: () => true });

    await service.signInWithGoogle();

    expect(firebaseAuthApi.signInWithPopup).toHaveBeenCalled();
    expect(firebaseFirestoreApi.updateDoc as jasmine.Spy).toHaveBeenCalledWith({}, jasmine.objectContaining({
      uid: 'user-1',
      displayName: 'Ada',
      email: 'ada@example.com',
      photoURL: 'https://example.com/ada.png',
    }));
    expect(firebaseFirestoreApi.setDoc).not.toHaveBeenCalled();
    expect(service.busy()).toBeFalse();
  });

  it('creates a profile with safe display defaults for a new user', async () => {
    const service = TestBed.inject(AuthService);
    const anonymousUser = { ...user, displayName: null, email: null, photoURL: null } as User;
    (firebaseAuthApi.signInWithPopup as jasmine.Spy).and.resolveTo({ user: anonymousUser });
    (firebaseFirestoreApi.getDoc as jasmine.Spy).and.resolveTo({ exists: () => false });

    await service.signInWithGoogle();

    expect(firebaseFirestoreApi.setDoc as jasmine.Spy).toHaveBeenCalledWith({}, jasmine.objectContaining({
      uid: 'user-1',
      displayName: 'Player',
      email: null,
      photoURL: null,
      createdAt: jasmine.anything(),
    }));
  });

  it('signs in a QA user with email and password', async () => {
    const service = TestBed.inject(AuthService);
    (firebaseAuthApi.signInWithEmailAndPassword as jasmine.Spy).and.resolveTo({ user });
    (firebaseFirestoreApi.getDoc as jasmine.Spy).and.resolveTo({ exists: () => false });

    await service.signInWithQaEmail('qa@example.com', 'test-password');

    expect(firebaseAuthApi.signInWithEmailAndPassword).toHaveBeenCalledWith(
      jasmine.anything(),
      'qa@example.com',
      'test-password',
    );
    expect(firebaseFirestoreApi.setDoc as jasmine.Spy).toHaveBeenCalled();
    expect(service.error()).toBeNull();
  });

  [
    ['auth/popup-closed-by-user', 'Sign-in was cancelled.'],
    ['auth/unauthorized-domain', 'This domain is not authorized for Google Sign-in.'],
    ['auth/network-request-failed', 'Unable to sign in right now. Please try again.'],
  ].forEach(([code, message]) => {
    it(`reports ${code}`, async () => {
      const service = TestBed.inject(AuthService);
      (firebaseAuthApi.signInWithPopup as jasmine.Spy).and.rejectWith(new FirebaseError(code, 'failed'));

      await service.signInWithGoogle();

      expect(service.error()).toBe(message);
      expect(service.busy()).toBeFalse();
    });
  });

  it('reports unexpected sign-in errors', async () => {
    const service = TestBed.inject(AuthService);
    (firebaseAuthApi.signInWithPopup as jasmine.Spy).and.rejectWith('failed');

    await service.signInWithGoogle();

    expect(service.error()).toBe('Something went wrong. Please try again.');
  });

  it('signs out and returns to the login page', async () => {
    const service = TestBed.inject(AuthService);
    (firebaseAuthApi.signOut as jasmine.Spy).and.resolveTo();

    await service.signOut();

    expect(firebaseAuthApi.signOut).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(service.error()).toBeNull();
    expect(service.busy()).toBeFalse();
  });

  it('reports sign-out failures without navigating', async () => {
    const service = TestBed.inject(AuthService);
    (firebaseAuthApi.signOut as jasmine.Spy).and.rejectWith(new Error('failed'));

    await service.signOut();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(service.error()).toBe('Something went wrong. Please try again.');
    expect(service.busy()).toBeFalse();
  });
});
