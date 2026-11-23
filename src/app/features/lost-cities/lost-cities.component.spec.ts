import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { GameRecordsService } from '../../core/games/game-records.service';
import { LostCitiesComponent } from './lost-cities.component';

describe('LostCitiesComponent', () => {
  let fixture: ComponentFixture<LostCitiesComponent>;
  let component: LostCitiesComponent;
  let records: jasmine.SpyObj<GameRecordsService>;

  beforeEach(async () => {
    records = jasmine.createSpyObj<GameRecordsService>('GameRecordsService', ['saveLostCitiesGame']);
    records.saveLostCitiesGame.and.resolveTo('game-id');
    const router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [LostCitiesComponent],
      providers: [
        { provide: GameRecordsService, useValue: records },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { user: signal({ uid: 'test' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LostCitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('toggles a card and recalculates the expedition score', () => {
    component.toggleValue('player1', 'red', 2);
    component.toggleValue('player1', 'red', 5);
    expect(component.score('player1', 'red')).toBe(-13);
    component.toggleValue('player1', 'red', 2);
    expect(component.score('player1', 'red')).toBe(-15);
  });

  it('applies the investment multiplier', () => {
    component.toggleValue('player2', 'blue', 7);
    component.toggleValue('player2', 'blue', 8);
    component.toggleValue('player2', 'blue', 10);
    component.setInvestments('player2', 'blue', 2);
    expect(component.score('player2', 'blue')).toBe(15);
  });

  it('keeps rounds independent', () => {
    component.toggleValue('player1', 'green', 10);
    component.selectRound(1);
    expect(component.score('player1', 'green')).toBe(0);
    component.toggleValue('player1', 'green', 8);
    component.selectRound(0);
    expect(component.score('player1', 'green')).toBe(-10);
  });

  it('uses five lanes by default and displays white instead of purple', () => {
    const rows = fixture.nativeElement.querySelectorAll('.expedition-row');
    expect(component.expeditionCount()).toBe(5);
    expect(component.expeditions().map(({ id }) => id)).toContain('white');
    expect(component.expeditions().map(({ id }) => id)).not.toContain('purple');
    expect(rows.length).toBe(5);
    expect(fixture.nativeElement.querySelector('.expedition-row.white')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.expedition-row.purple')).toBeNull();
  });

  it('adds the purple lane to scores in six-lane mode', () => {
    component.toggleValue('player1', 'purple', 10);
    expect(component.roundTotal('player1')).toBe(0);

    component.selectExpeditionCount(6);
    fixture.detectChanges();

    expect(component.expeditions().map(({ id }) => id)).toContain('purple');
    expect(component.roundTotal('player1')).toBe(-10);
    expect(fixture.nativeElement.querySelectorAll('.expedition-row').length).toBe(6);
  });

  it('preserves purple entries while the six-lane mode is disabled', () => {
    component.selectExpeditionCount(6);
    component.toggleValue('player2', 'purple', 8);
    expect(component.roundTotal('player2')).toBe(-12);

    component.selectExpeditionCount(5);
    expect(component.roundTotal('player2')).toBe(0);

    component.selectExpeditionCount(6);
    expect(component.roundTotal('player2')).toBe(-12);
  });

  it('saves exactly three round totals', async () => {
    component.toggleValue('player1', 'yellow', 10);
    await component.saveGame();
    expect(records.saveLostCitiesGame).toHaveBeenCalledWith(jasmine.objectContaining({
      roundScores: jasmine.arrayWithExactContents([
        { player1: -10, player2: 0 },
        { player1: 0, player2: 0 },
        { player1: 0, player2: 0 },
      ]),
      expeditionCount: 5,
    }));
  });

  it('saves the selected expedition mode with six-lane totals', async () => {
    component.selectExpeditionCount(6);
    component.toggleValue('player2', 'purple', 10);
    await component.saveGame();

    expect(records.saveLostCitiesGame).toHaveBeenCalledWith(jasmine.objectContaining({
      expeditionCount: 6,
      totals: { player1: 0, player2: -10 },
    }));
  });

  it('does not save empty player names', async () => {
    component.playerNames[0] = ' ';

    await component.saveGame();

    expect(records.saveLostCitiesGame).not.toHaveBeenCalled();
    expect(component.error()).toContain('both player names');
  });

  it('surfaces a save error and clears the saving state', async () => {
    records.saveLostCitiesGame.and.rejectWith(new Error('Storage unavailable'));

    await component.saveGame();

    expect(component.error()).toBe('Storage unavailable');
    expect(component.saving()).toBeFalse();
  });

  it('uses a fallback for non-Error save failures', async () => {
    records.saveLostCitiesGame.and.rejectWith('failed');

    await component.saveGame();

    expect(component.error()).toBe('Unable to save this game.');
  });
});
