import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GameRecordsService, SavedGame } from '../../core/games/game-records.service';
import { HistoryComponent } from './history.component';

describe('HistoryComponent', () => {
  let records: jasmine.SpyObj<GameRecordsService>;

  beforeEach(async () => {
    records = jasmine.createSpyObj<GameRecordsService>('GameRecordsService', ['history']);
    records.history.and.resolveTo([]);
    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [provideRouter([]), { provide: GameRecordsService, useValue: records }],
    }).compileComponents();
  });

  it('loads an empty history', async () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.games()).toEqual([]);
    expect(fixture.nativeElement.querySelector('.empty')).not.toBeNull();
  });

  it('formats Lost Cities and Sea Salt & Paper scores', () => {
    const component = TestBed.createComponent(HistoryComponent).componentInstance;
    const lost = {
      roundScores: [{ player1: -10, player2: 4 }],
      totals: { player1: -10, player2: 4 },
    } as unknown as SavedGame;
    const sea = {
      roundScores: [[40, 20]],
      totals: [40, 20],
    } as unknown as SavedGame;

    expect(component.roundDisplay(lost, 0)).toBe('-10–4');
    expect(component.totalDisplay(lost)).toBe('-10 – 4');
    expect(component.roundDisplay(sea, 0)).toBe('40–20');
    expect(component.totalDisplay(sea)).toBe('40 – 20');
  });

  it('reports history loading failures', async () => {
    records.history.and.rejectWith(new Error('failed'));
    const fixture = TestBed.createComponent(HistoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toContain('Unable to load');
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.state.error')).not.toBeNull();
  });

  it('renders loaded games', async () => {
    records.history.and.resolveTo([{
      id: 'game-id',
      gameSlug: 'lost-cities',
      expeditionCount: 6,
      playerNames: ['Ada', 'Grace'],
      roundScores: [
        { player1: 10, player2: 2 },
        { player1: 0, player2: 0 },
        { player1: 0, player2: 0 },
      ],
      totals: { player1: 10, player2: 2 },
      winnerName: 'Ada',
      ownerUid: 'user-1',
      completedAt: new Date(),
      createdAt: new Date(),
    }]);
    const fixture = TestBed.createComponent(HistoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.tag').textContent).toContain('6 expeditions');
  });
});
