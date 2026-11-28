import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';

import { AuthService } from '../auth/auth.service';
import { firebaseFirestoreApi } from '../firebase/firebase';
import { PlayersService } from './players.service';

describe('PlayersService', () => {
  const user = signal<{ uid: string } | null>({ uid: 'user-1' });

  beforeEach(() => {
    user.set({ uid: 'user-1' });
    spyOn(firebaseFirestoreApi, 'collection').and.returnValue({ path: 'players' } as never);
    spyOn(firebaseFirestoreApi, 'orderBy').and.returnValue({ order: true } as never);
    spyOn(firebaseFirestoreApi, 'query').and.returnValue({ query: true } as never);
    spyOn(firebaseFirestoreApi, 'getDocs');
    spyOn(firebaseFirestoreApi, 'addDoc');
    spyOn(firebaseFirestoreApi, 'doc').and.returnValue({ path: 'player' } as never);
    spyOn(firebaseFirestoreApi, 'updateDoc').and.resolveTo();
    spyOn(firebaseFirestoreApi, 'serverTimestamp').and.returnValue({ timestamp: true } as never);

    TestBed.configureTestingModule({
      providers: [
        PlayersService,
        { provide: AuthService, useValue: { user: user.asReadonly() } },
      ],
    });
  });

  it('requires authentication to list or create players', async () => {
    user.set(null);
    const service = TestBed.inject(PlayersService);

    await expectAsync(service.list()).toBeRejectedWithError('Sign in to manage players.');
    await expectAsync(service.create({ name: 'Ada' })).toBeRejectedWithError('Sign in to manage players.');
  });

  it('lists players in name order and hydrates timestamps', async () => {
    const date = new Date('2026-01-01T00:00:00Z');
    (firebaseFirestoreApi.getDocs as jasmine.Spy).and.resolveTo({
      docs: [{
        id: 'ada',
        data: () => ({
          ownerUid: 'user-1',
          name: 'Ada',
          createdAt: Timestamp.fromDate(date),
          updatedAt: Timestamp.fromDate(date),
        }),
      }],
    });

    const players = await TestBed.inject(PlayersService).list();

    expect(firebaseFirestoreApi.orderBy).toHaveBeenCalledWith('name', 'asc');
    expect(players[0]).toEqual(jasmine.objectContaining({
      id: 'ada',
      name: 'Ada',
      createdAt: date,
      updatedAt: date,
    }));
  });

  it('creates and renames players with trimmed valid names', async () => {
    (firebaseFirestoreApi.addDoc as jasmine.Spy).and.resolveTo({ id: 'ada' });
    const service = TestBed.inject(PlayersService);

    await service.create({ name: '  Ada  ' });
    await service.rename('ada', '  Ada Lovelace ');

    expect(firebaseFirestoreApi.addDoc).toHaveBeenCalledWith(
      jasmine.anything(),
      jasmine.objectContaining({ ownerUid: 'user-1', name: 'Ada' }),
    );
    expect(firebaseFirestoreApi.updateDoc as jasmine.Spy).toHaveBeenCalledWith(
      jasmine.anything(),
      jasmine.objectContaining({ name: 'Ada Lovelace' }),
    );
  });

  it('rejects empty or oversized names', async () => {
    const service = TestBed.inject(PlayersService);

    await expectAsync(service.create({ name: '   ' }))
      .toBeRejectedWithError('Enter a player name.');
    await expectAsync(service.rename('ada', 'x'.repeat(51)))
      .toBeRejectedWithError('Player names must be 50 characters or fewer.');
  });
});
