import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { GameRecordsService } from '../../core/games/game-records.service';
import { SeaSaltPaperComponent } from './sea-salt-paper.component';

describe('SeaSaltPaperComponent', () => {
  let fixture: ComponentFixture<SeaSaltPaperComponent>;
  let component: SeaSaltPaperComponent;
  let records: jasmine.SpyObj<GameRecordsService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    records = jasmine.createSpyObj<GameRecordsService>('GameRecordsService', ['saveSeaSaltPaperGame']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    records.saveSeaSaltPaperGame.and.resolveTo('game-id');
    router.navigateByUrl.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [SeaSaltPaperComponent],
      providers: [
        { provide: GameRecordsService, useValue: records },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { user: signal({ uid: 'test' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SeaSaltPaperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults to two players and a 40 point target', () => {
    expect(component.playerCount()).toBe(2);
    expect(component.targetScore).toBe(40);
    expect(component.activeNames.length).toBe(2);
  });

  it('updates player count and target score', () => {
    component.updatePlayerCount(4);
    expect(component.playerCount()).toBe(4);
    expect(component.targetScore).toBe(30);
    expect(component.activeNames.length).toBe(4);
  });

  [2, 3, 4].forEach((playerCount) => {
    it(`renders labeled mobile score inputs for ${playerCount} players`, () => {
      component.updatePlayerCount(playerCount);
      fixture.detectChanges();
      const scoreCells = (fixture.nativeElement as HTMLElement)
        .querySelectorAll('.score-sheet tbody td');

      expect(scoreCells.length).toBe(playerCount);
      scoreCells.forEach((cell, index) => {
        expect(cell.getAttribute('data-label')).toBe(`Player ${index + 1}`);
        expect(cell.querySelector('input')?.getAttribute('inputmode')).toBe('numeric');
      });
    });
  });

  it('adds, updates, and totals rounds', () => {
    component.updateScore(0, 0, 17);
    component.addRound();
    component.updateScore(1, 0, 25);
    expect(component.rounds().length).toBe(2);
    expect(component.activeTotals[0]).toBe(42);
    expect(component.isComplete).toBeTrue();
  });

  it('updates names and normalizes non-finite scores to zero', () => {
    component.updateName(1, 'Grace');
    component.updateScore(0, 0, Number.NaN);

    expect(component.playerNames()[1]).toBe('Grace');
    expect(component.rounds()[0][0]).toBe(0);
  });

  it('limits the score sheet to twenty rounds and removes rounds safely', () => {
    component.rounds.set(Array.from({ length: 20 }, () => [0, 0, 0, 0]));
    component.addRound();
    expect(component.rounds()).toHaveSize(20);

    component.rounds.set([[1, 2, 3, 4]]);
    component.removeRound();
    expect(component.rounds()).toHaveSize(1);

    component.addRound();
    component.removeRound();
    expect(component.rounds()).toHaveSize(1);
  });

  it('reports the winner from active players', () => {
    component.updatePlayerCount(3);
    component.updateScore(0, 2, 35);

    expect(component.winner).toBe('Player 3');
  });

  it('saves a valid completed game and opens history', async () => {
    component.updateScore(0, 0, 40);
    await component.saveGame();
    expect(records.saveSeaSaltPaperGame).toHaveBeenCalledWith(jasmine.objectContaining({
      gameSlug: 'sea-salt-paper',
      roundScores: [[40, 0, 0, 0].slice(0, 2)],
      totals: [40, 0],
    }));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/history');
  });

  it('saves a completed three-player game with all round columns', async () => {
    component.updatePlayerCount(3);
    component.updateScore(0, 0, 13);
    component.updateScore(0, 1, 9);
    component.updateScore(0, 2, 35);

    await component.saveGame();

    expect(records.saveSeaSaltPaperGame).toHaveBeenCalledWith(jasmine.objectContaining({
      playerNames: ['Player 1', 'Player 2', 'Player 3'],
      roundScores: [[13, 9, 35]],
      totals: [13, 9, 35],
      targetScore: 35,
    }));
  });

  it('saves a completed four-player game with all round columns', async () => {
    component.updatePlayerCount(4);
    component.updateScore(0, 0, 8);
    component.updateScore(0, 1, 11);
    component.updateScore(0, 2, 4);
    component.updateScore(0, 3, 30);

    await component.saveGame();

    expect(records.saveSeaSaltPaperGame).toHaveBeenCalledWith(jasmine.objectContaining({
      playerNames: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
      roundScores: [[8, 11, 4, 30]],
      totals: [8, 11, 4, 30],
      targetScore: 30,
    }));
  });

  it('does not save before the target is reached', async () => {
    component.updateScore(0, 0, 12);
    await component.saveGame();
    expect(records.saveSeaSaltPaperGame).not.toHaveBeenCalled();
    expect(component.error()).toContain('40 points');
  });

  it('does not save an empty player name', async () => {
    component.updateName(0, '  ');
    component.updateScore(0, 0, 40);

    await component.saveGame();

    expect(records.saveSeaSaltPaperGame).not.toHaveBeenCalled();
    expect(component.error()).toContain('every player name');
  });

  [
    ['Missing or insufficient permissions', 'Firebase rejected this score sheet.'],
    ['Nested arrays are not supported', 'Unable to save this score format.'],
    ['Unexpected failure', 'Unable to save this game. Please try again.'],
  ].forEach(([failure, message]) => {
    it(`handles save failure: ${failure}`, async () => {
      spyOn(console, 'error');
      records.saveSeaSaltPaperGame.and.rejectWith(new Error(failure));
      component.updateScore(0, 0, 40);

      await component.saveGame();

      expect(component.error()).toContain(message);
      expect(component.saving()).toBeFalse();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  it('uses the generic save message for non-Error failures', async () => {
    spyOn(console, 'error');
    records.saveSeaSaltPaperGame.and.rejectWith('failed');
    component.updateScore(0, 0, 40);

    await component.saveGame();

    expect(component.error()).toBe('Unable to save this game. Please try again.');
  });
});
