import { Injectable, inject } from '@angular/core';
import {
  Timestamp,
} from 'firebase/firestore';

import { AuthService } from '../auth/auth.service';
import { firebaseFirestoreApi, firestore } from '../firebase/firebase';
import { LostCitiesExpeditionCount, SavedLostCitiesGame } from '../../features/lost-cities/lost-cities.models';
import { SavedSeaSaltPaperGame, StoredSeaSaltRound, determineWinnerIndex, fromStoredSeaSaltRounds, toStoredSeaSaltRounds } from '../../features/sea-salt-paper/sea-salt-paper.models';

export type NewLostCitiesGame = Omit<SavedLostCitiesGame, 'id' | 'completedAt' | 'createdAt' | 'winnerName' | 'winnerPlayerId' | 'ownerUid' | 'expeditionCount'> & {
  expeditionCount: LostCitiesExpeditionCount;
};
export type NewSeaSaltPaperGame = Omit<SavedSeaSaltPaperGame, 'id' | 'completedAt' | 'createdAt' | 'winnerName' | 'winnerPlayerId' | 'ownerUid'>;
export type SavedGame = SavedLostCitiesGame | SavedSeaSaltPaperGame;

@Injectable({ providedIn: 'root' })
export class GameRecordsService {
  private readonly auth = inject(AuthService);

  async saveLostCitiesGame(game: NewLostCitiesGame): Promise<string> {
    const user = this.auth.user();
    if (!user) throw new Error('Sign in before saving a game.');

    const winnerIndex = game.totals.player1 === game.totals.player2
      ? -1
      : game.totals.player1 > game.totals.player2 ? 0 : 1;
    const winnerName = winnerIndex === -1
      ? 'Tie'
      : game.playerNames[winnerIndex];
    const playerIds: [string | null, string | null] = game.playerIds ?? [null, null];
    const reference = await firebaseFirestoreApi.addDoc(
      firebaseFirestoreApi.collection(firestore, 'users', user.uid, 'games'), {
      ...game,
      playerIds,
      ownerUid: user.uid,
      winnerName,
      winnerPlayerId: winnerIndex === -1 ? null : playerIds[winnerIndex],
      createdAt: firebaseFirestoreApi.serverTimestamp(),
      completedAt: firebaseFirestoreApi.serverTimestamp(),
    });
    return reference.id;
  }

  async saveSeaSaltPaperGame(game: NewSeaSaltPaperGame): Promise<string> {
    const user = this.auth.user();
    if (!user) throw new Error('Sign in before saving a game.');

    const winnerIndex = determineWinnerIndex(game.roundScores);
    const winnerName = winnerIndex === null ? 'Tie' : game.playerNames[winnerIndex];
    const playerIds = game.playerIds ?? game.playerNames.map(() => null);
    const reference = await firebaseFirestoreApi.addDoc(
      firebaseFirestoreApi.collection(firestore, 'users', user.uid, 'games'), {
      ...game,
      playerIds,
      roundScores: toStoredSeaSaltRounds(game.roundScores),
      ownerUid: user.uid,
      winnerName,
      winnerPlayerId: winnerIndex === null ? null : playerIds[winnerIndex] ?? null,
      createdAt: firebaseFirestoreApi.serverTimestamp(),
      completedAt: firebaseFirestoreApi.serverTimestamp(),
    });
    return reference.id;
  }

  async history(): Promise<SavedGame[]> {
    const user = this.auth.user();
    if (!user) return [];

    const result = await firebaseFirestoreApi.getDocs(firebaseFirestoreApi.query(
      firebaseFirestoreApi.collection(firestore, 'users', user.uid, 'games'),
      firebaseFirestoreApi.orderBy('completedAt', 'desc'),
    ));

    return result.docs
      .map((snapshot) => {
        const data = snapshot.data();
        const roundScores = data['roundScores'] as StoredSeaSaltRound[];
        return {
          ...data,
          ...(data['gameSlug'] === 'sea-salt-paper'
            ? { roundScores: fromStoredSeaSaltRounds(roundScores) }
            : {}),
          id: snapshot.id,
          completedAt: (data['completedAt'] as Timestamp).toDate(),
          createdAt: (data['createdAt'] as Timestamp).toDate(),
        } as SavedGame;
      });
  }

}
