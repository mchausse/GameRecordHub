import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FirebaseError,
} from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
} from 'firebase/auth';

import { auth, firebaseAuthApi, firebaseFirestoreApi, firestore } from '../firebase/firebase';
import { I18nService } from '../i18n/i18n.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly _user = signal<User | null>(null);
  private readonly _initialized = signal(false);
  private readonly _busy = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly initialized = this._initialized.asReadonly();
  readonly busy = this._busy.asReadonly();
  readonly error = this._error.asReadonly();
  readonly ready = new Promise<void>((resolve) => {
    firebaseAuthApi.onAuthStateChanged(auth, (user) => {
      this._user.set(user);
      this._initialized.set(true);
      resolve();
    });
  });

  constructor() {}

  async signInWithGoogle(): Promise<void> {
    this._busy.set(true);
    this._error.set(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const { user } = await firebaseAuthApi.signInWithPopup(auth, provider);
      await this.upsertUserProfile(user);
    } catch (error) {
      this._error.set(this.errorMessage(error));
    } finally {
      this._busy.set(false);
    }
  }

  async signOut(): Promise<void> {
    this._busy.set(true);
    this._error.set(null);

    try {
      await firebaseAuthApi.signOut(auth);
      await this.router.navigateByUrl('/login');
    } catch (error) {
      this._error.set(this.errorMessage(error));
    } finally {
      this._busy.set(false);
    }
  }

  private async upsertUserProfile(user: User): Promise<void> {
    const profileRef = firebaseFirestoreApi.doc(firestore, 'users', user.uid);
    const snapshot = await firebaseFirestoreApi.getDoc(profileRef);
    const profile = {
      uid: user.uid,
      displayName: user.displayName ?? 'Player',
      email: user.email ?? null,
      photoURL: user.photoURL,
      updatedAt: firebaseFirestoreApi.serverTimestamp(),
    };

    if (snapshot.exists()) {
      await firebaseFirestoreApi.updateDoc(profileRef, profile);
      return;
    }

    await firebaseFirestoreApi.setDoc(profileRef, {
      ...profile,
      createdAt: firebaseFirestoreApi.serverTimestamp(),
    });
  }

  private errorMessage(error: unknown): string {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          return this.i18n.translate('Sign-in was cancelled.');
        case 'auth/unauthorized-domain':
          return this.i18n.translate('This domain is not authorized for Google Sign-in.');
        default:
          return this.i18n.translate('Unable to sign in right now. Please try again.');
      }
    }

    return this.i18n.translate('Something went wrong. Please try again.');
  }
}
