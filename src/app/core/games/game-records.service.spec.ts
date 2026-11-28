import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';

import { AuthService } from '../auth/auth.service';
import { firebaseFirestoreApi } from '../firebase/firebase';
import { GameRecordsService, NewLostCitiesGame, NewSeaSaltPaperGame } from './game-records.service';

describe('GameRecordsService', () => {
  const authUser = signal<{ uid: string } | null>({ uid: 'user-1' });

  beforeEach(() => {
    authUser.set({ uid: 'user-1' });
    spyOn(firebaseFirestoreApi, 'collection').and.returnValue({ path: 'games' } as never);
    spyOn(firebaseFirestoreApi, 'addDoc');
    spyOn(firebaseFirestoreApi, 'getDocs');
    spyOn(firebaseFirestoreApi, 'orderBy').and.returnValue({ order: true } as never);
    spyOn(firebaseFirestoreApi, 'query').and.returnValue({ query: true } as never);
    spyOn(firebaseFirestoreApi, 'serverTimestamp').and.returnValue({ timestamp: true } as never);

    TestBed.configureTestingModule({
      providers: [
        GameRecordsService,
        { provide: AuthService, useValue: { user: authUser.asReadonly() } },
      ],
    });
  });

  const lostCitiesGame = (player1: number, player2: number): NewLostCitiesGame => ({
    gameSlug: 'lost-cities',
    expeditionCount: 5,
    playerNames: ['Ada', 'Grace'],
    roundScores: [
      { player1, player2 },
      { player1: 0, player2: 0 },
      { player1: 0, player2: 0 },
    ],
    totals: { player1, player2 },
    playerIds: ['ada', null],
  });

  it('requires authentication before saving Lost Cities', async () => {
    authUser.set(null);
    const service = TestBed.inject(GameRecordsService);

    await expectAsync(service.saveLostCitiesGame(lostCitiesGame(1, 0)))
      .toBeRejectedWithError('Sign in before saving a game.');
    expect(firebaseFirestoreApi.addDoc).not.toHaveBeenCalled();
  });

  [
    [5, 2, 'Ada'],
    [2, 5, 'Grace'],
    [3, 3, 'Tie'],
  ].forEach(([player1, player2, winnerName]) => {
    it(`saves Lost Cities winner ${winnerName}`, async () => {
      const service = TestBed.inject(GameRecordsService);
      (firebaseFirestoreApi.addDoc as jasmine.Spy).and.resolveTo({ id: 'lost-id' });

      const id = await service.saveLostCitiesGame(lostCitiesGame(player1 as number, player2 as number));

      expect(id).toBe('lost-id');
      expect(firebaseFirestoreApi.addDoc as jasmine.Spy).toHaveBeenCalledWith(
        jasmine.objectContaining({ path: 'games' }),
        jasmine.objectContaining({
          ownerUid: 'user-1',
          winnerName,
          winnerPlayerId: winnerName === 'Ada' ? 'ada' : winnerName === 'Grace' ? null : null,
        }),
      );
    });
  });

  it('requires authentication before saving Sea Salt & Paper', async () => {
    authUser.set(null);
    const service = TestBed.inject(GameRecordsService);
    const game = {
      gameSlug: 'sea-salt-paper',
      playerNames: ['Ada', 'Grace'],
      roundScores: [[40, 0]],
      totals: [40, 0],
      targetScore: 40,
    } satisfies NewSeaSaltPaperGame;

    await expectAsync(service.saveSeaSaltPaperGame(game))
      .toBeRejectedWithError('Sign in before saving a game.');
  });

  [2, 3, 4].forEach((playerCount) => {
    it(`persists saved-player IDs for a ${playerCount}-player Sea Salt & Paper game`, async () => {
      const service = TestBed.inject(GameRecordsService);
      (firebaseFirestoreApi.addDoc as jasmine.Spy).and.resolveTo({ id: 'sea-id' });
      const names = Array.from({ length: playerCount }, (_, index) => `Player ${index + 1}`);
      const playerIds = Array.from({ length: playerCount }, (_, index) => index === 0 ? 'ada' : null);
      const totals = names.map((_, index) => index === 0 ? 40 : 0);

      await service.saveSeaSaltPaperGame({
        gameSlug: 'sea-salt-paper',
        playerNames: names,
        playerIds,
        roundScores: [totals],
        totals,
        targetScore: playerCount === 2 ? 40 : playerCount === 3 ? 35 : 30,
      });

      expect(firebaseFirestoreApi.addDoc).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          playerIds,
          winnerPlayerId: 'ada',
        }),
      );
    });
  });

  [
    {
      label: 'a unique leader',
      names: ['Ada', 'Grace'],
      rounds: [[10, 4], [31, 30]],
      winner: 'Ada',
    },
    {
      label: 'the final-round leader when match totals tie',
      names: ['Ada', 'Grace'],
      rounds: [[20, 10], [10, 20]],
      winner: 'Grace',
    },
    {
      label: 'a tie when leaders also tie in the final round',
      names: ['Ada', 'Grace', 'Katherine'],
      rounds: [[20, 20, 20], [10, 10, 10]],
      winner: 'Tie',
    },
  ].forEach(({ label, names, rounds, winner }) => {
    it(`saves Sea Salt & Paper with ${label}`, async () => {
      const service = TestBed.inject(GameRecordsService);
      (firebaseFirestoreApi.addDoc as jasmine.Spy).and.resolveTo({ id: 'sea-id' });
      const totals = names.map((_, index) => rounds.reduce((sum, round) => sum + round[index], 0));
      const game = {
        gameSlug: 'sea-salt-paper',
        playerNames: names,
        roundScores: rounds,
        totals,
        targetScore: 40,
      } as NewSeaSaltPaperGame;

      await service.saveSeaSaltPaperGame(game);

      expect(firebaseFirestoreApi.addDoc as jasmine.Spy).toHaveBeenCalledWith(
        jasmine.objectContaining({ path: 'games' }),
        jasmine.objectContaining({
          winnerName: winner,
          roundScores: rounds.map((scores) => ({ scores })),
        }),
      );
    });
  });

  it('resolves an empty-totals tie if no rounds exist', async () => {
    const service = TestBed.inject(GameRecordsService);
    (firebaseFirestoreApi.addDoc as jasmine.Spy).and.resolveTo({ id: 'sea-id' });

    await service.saveSeaSaltPaperGame({
      gameSlug: 'sea-salt-paper',
      playerNames: ['Ada', 'Grace'],
      roundScores: [],
      totals: [0, 0],
      targetScore: 40,
    });

    expect(firebaseFirestoreApi.addDoc as jasmine.Spy).toHaveBeenCalledWith(
      jasmine.objectContaining({ path: 'games' }),
      jasmine.objectContaining({ winnerName: 'Tie' }),
    );
  });

  it('returns an empty history for signed-out users', async () => {
    authUser.set(null);
    const service = TestBed.inject(GameRecordsService);

    expect(await service.history()).toEqual([]);
    expect(firebaseFirestoreApi.getDocs).not.toHaveBeenCalled();
  });

  it('hydrates both stored game formats and converts timestamps', async () => {
    const service = TestBed.inject(GameRecordsService);
    const completedAt = new Date('2026-01-01T10:00:00Z');
    const createdAt = new Date('2026-01-01T09:00:00Z');
    (firebaseFirestoreApi.getDocs as jasmine.Spy).and.resolveTo({
      docs: [
        {
          id: 'lost-id',
          data: () => ({
            gameSlug: 'lost-cities',
            playerNames: ['Ada', 'Grace'],
            roundScores: [{ player1: 1, player2: 2 }],
            completedAt: Timestamp.fromDate(completedAt),
            createdAt: Timestamp.fromDate(createdAt),
          }),
        },
        {
          id: 'sea-id',
          data: () => ({
            gameSlug: 'sea-salt-paper',
            playerNames: ['Ada', 'Grace'],
            roundScores: [{ scores: [40, 20] }],
            completedAt: Timestamp.fromDate(completedAt),
            createdAt: Timestamp.fromDate(createdAt),
          }),
        },
      ],
    });

    const games = await service.history();

    expect(games[0].id).toBe('lost-id');
    expect(games[0].completedAt).toEqual(completedAt);
    expect(games[1].roundScores).toEqual([[40, 20]]);
    expect(games[1].createdAt).toEqual(createdAt);
  });
});
