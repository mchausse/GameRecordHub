import { Injectable, inject } from '@angular/core';
import { Timestamp } from 'firebase/firestore';

import { AuthService } from '../auth/auth.service';
import { firebaseFirestoreApi, firestore } from '../firebase/firebase';
import { NewSavedPlayer, SavedPlayer } from './player.models';

@Injectable({ providedIn: 'root' })
export class PlayersService {
  private readonly auth = inject(AuthService);

  async list(): Promise<SavedPlayer[]> {
    const user = this.auth.user();
    if (!user) throw new Error('Sign in to manage players.');

    const snapshot = await firebaseFirestoreApi.getDocs(
      firebaseFirestoreApi.query(
        firebaseFirestoreApi.collection(firestore, 'users', user.uid, 'players'),
        firebaseFirestoreApi.orderBy('name', 'asc'),
      ),
    );

    return snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        ownerUid: data['ownerUid'] as string,
        name: data['name'] as string,
        createdAt: (data['createdAt'] as Timestamp).toDate(),
        updatedAt: (data['updatedAt'] as Timestamp).toDate(),
      };
    });
  }

  async create(player: NewSavedPlayer): Promise<string> {
    const user = this.auth.user();
    if (!user) throw new Error('Sign in to manage players.');
    const name = this.validName(player.name);
    const reference = await firebaseFirestoreApi.addDoc(
      firebaseFirestoreApi.collection(firestore, 'users', user.uid, 'players'),
      {
        ownerUid: user.uid,
        name,
        createdAt: firebaseFirestoreApi.serverTimestamp(),
        updatedAt: firebaseFirestoreApi.serverTimestamp(),
      },
    );
    return reference.id;
  }

  async rename(playerId: string, name: string): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('Sign in to manage players.');
    await firebaseFirestoreApi.updateDoc(
      firebaseFirestoreApi.doc(firestore, 'users', user.uid, 'players', playerId),
      {
        name: this.validName(name),
        updatedAt: firebaseFirestoreApi.serverTimestamp(),
      },
    );
  }

  private validName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Enter a player name.');
    if (trimmed.length > 50) throw new Error('Player names must be 50 characters or fewer.');
    return trimmed;
  }
}
