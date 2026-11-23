import { Injectable, inject } from '@angular/core';
import {
  Timestamp,
} from 'firebase/firestore';

import { AuthService } from '../auth/auth.service';
import { firebaseFirestoreApi, firestore } from '../firebase/firebase';
import { LostCitiesExpeditionCount, SavedLostCitiesGame } from '../../features/lost-cities/lost-cities.models';
import { SavedSeaSaltPaperGame, StoredSeaSaltRound, fromStoredSeaSaltRounds, toStoredSeaSaltRounds } from '../../features/sea-salt-paper/sea-salt-paper.models';

export type NewLostCitiesGame = Omit<SavedLostCitiesGame, 'id' | 'completedAt' | 'createdAt' | 'winnerName' | 'ownerUid' | 'expeditionCount'> & {
  expeditionCount: LostCitiesExpeditionCount;
};
export type NewSeaSaltPaperGame = Omit<SavedSeaSaltPaperGame, 'id' | 'completedAt' | 'createdAt' | 'winnerName' | 'ownerUid'>;
export type SavedGame = SavedLostCitiesGame | SavedSeaSaltPaperGame;

@Injectable({ providedIn: 'root' })
export class GameRecordsService {
  private readonly auth = inject(AuthService);

  async saveLostCitiesGame(game: NewLostCitiesGame): Promise<string> {
    const user = this.auth.user();
    if (!user) throw new Error('Sign in before saving a game.');

    const winnerName = game.totals.player1 === game.totals.player2
      ? 'Tie'
      : game.totals.player1 > game.totals.player2 ? game.playerNames[0] : game.playerNames[1];
    const reference = await firebaseFirestoreApi.addDoc(
      firebaseFirestoreApi.collection(firestore, 'users', user.uid, 'games'), {
      ...game,
      ownerUid: user.uid,
      winnerName,
      createdAt: firebaseFirestoreApi.serverTimestamp(),
      completedAt: firebaseFirestoreApi.serverTimestamp(),
    });
    return reference.id;
  }

  async saveSeaSaltPaperGame(game: NewSeaSaltPaperGame): Promise<string> {
    const user = this.auth.user();
    if (!user) throw new Error('Sign in before saving a game.');

    const winnerName = this.seaSaltPaperWinner(game.playerNames, game.roundScores);
    const reference = await firebaseFirestoreApi.addDoc(
      firebaseFirestoreApi.collection(firestore, 'users', user.uid, 'games'), {
      ...game,
      roundScores: toStoredSeaSaltRounds(game.roundScores),
      ownerUid: user.uid,
      winnerName,
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

  private seaSaltPaperWinner(names: string[], rounds: number[][]): string {
    const totals = names.map((_, index) => rounds.reduce((sum, round) => sum + round[index], 0));
    const highest = Math.max(...totals);
    const leaders = names.map((name, index) => ({ name, index })).filter(({ index }) => totals[index] === highest);
    if (leaders.length === 1) return leaders[0].name;
    const finalRound = rounds.at(-1) ?? [];
    const bestFinal = Math.max(...leaders.map(({ index }) => finalRound[index]));
    const finalLeaders = leaders.filter(({ index }) => finalRound[index] === bestFinal);
    return finalLeaders.length === 1 ? finalLeaders[0].name : 'Tie';
  }
}
