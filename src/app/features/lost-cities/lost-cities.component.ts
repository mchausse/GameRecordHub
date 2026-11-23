import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { GameRecordsService } from '../../core/games/game-records.service';
import {
  CARD_VALUES,
  ExpeditionId,
  LostCitiesExpeditionCount,
  LostCitiesRound,
  emptyRound,
  expeditionsForCount,
  scoreExpedition,
} from './lost-cities.models';

@Component({
  selector: 'app-lost-cities',
  imports: [FormsModule],
  templateUrl: './lost-cities.component.html',
  styleUrl: './lost-cities.component.scss',
})
export class LostCitiesComponent {
  private readonly records = inject(GameRecordsService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly expeditionCount = signal<LostCitiesExpeditionCount>(5);
  readonly expeditions = computed(() => expeditionsForCount(this.expeditionCount()));
  readonly cardValues = CARD_VALUES;
  readonly players = ['player1', 'player2'] as const;
  readonly rounds = signal<LostCitiesRound[]>([emptyRound(), emptyRound(), emptyRound()]);
  readonly currentRound = signal(0);
  readonly playerNames: [string, string] = ['Player 1', 'Player 2'];
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  score(player: 'player1' | 'player2', expedition: ExpeditionId): number {
    return scoreExpedition(this.rounds()[this.currentRound()][player][expedition]);
  }

  roundTotal(player: 'player1' | 'player2', roundIndex = this.currentRound()): number {
    return this.expeditions().reduce(
      (sum, expedition) => sum + scoreExpedition(this.rounds()[roundIndex][player][expedition.id]),
      0,
    );
  }

  matchTotal(player: 'player1' | 'player2'): number {
    return [0, 1, 2].reduce((sum, index) => sum + this.roundTotal(player, index), 0);
  }

  hasValue(player: 'player1' | 'player2', expedition: ExpeditionId, value: number): boolean {
    return this.rounds()[this.currentRound()][player][expedition].values.includes(value);
  }

  toggleValue(player: 'player1' | 'player2', expedition: ExpeditionId, value: number): void {
    const rounds = structuredClone(this.rounds());
    const values = rounds[this.currentRound()][player][expedition].values;
    const index = values.indexOf(value);
    if (index >= 0) values.splice(index, 1);
    else values.push(value);
    values.sort((a, b) => a - b);
    this.rounds.set(rounds);
  }

  investments(player: 'player1' | 'player2', expedition: ExpeditionId): number {
    return this.rounds()[this.currentRound()][player][expedition].investments;
  }

  setInvestments(player: 'player1' | 'player2', expedition: ExpeditionId, value: number): void {
    const rounds = structuredClone(this.rounds());
    rounds[this.currentRound()][player][expedition].investments = Math.max(0, Math.min(3, value));
    this.rounds.set(rounds);
  }

  selectRound(index: number): void {
    this.currentRound.set(index);
  }

  selectExpeditionCount(count: LostCitiesExpeditionCount): void {
    this.expeditionCount.set(count);
  }

  async saveGame(): Promise<void> {
    const names = this.playerNames.map((name) => name.trim());
    if (names.some((name) => !name)) {
      this.error.set('Enter both player names before saving.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      await this.records.saveLostCitiesGame({
        gameSlug: 'lost-cities',
        expeditionCount: this.expeditionCount(),
        playerNames: [names[0], names[1]],
        roundScores: [
          { player1: this.roundTotal('player1', 0), player2: this.roundTotal('player2', 0) },
          { player1: this.roundTotal('player1', 1), player2: this.roundTotal('player2', 1) },
          { player1: this.roundTotal('player1', 2), player2: this.roundTotal('player2', 2) },
        ],
        totals: { player1: this.matchTotal('player1'), player2: this.matchTotal('player2') },
      });
      await this.router.navigateByUrl('/history');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to save this game.');
    } finally {
      this.saving.set(false);
    }
  }
}
