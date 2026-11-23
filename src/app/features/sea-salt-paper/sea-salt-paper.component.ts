import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { GameRecordsService } from '../../core/games/game-records.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { determineWinner, sumScores, targetScoreFor } from './sea-salt-paper.models';

@Component({
  selector: 'app-sea-salt-paper',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './sea-salt-paper.component.html',
  styleUrl: './sea-salt-paper.component.scss',
})
export class SeaSaltPaperComponent {
  private readonly records = inject(GameRecordsService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  readonly playerNames = signal(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  readonly playerCount = signal(2);
  readonly rounds = signal<number[][]>([[0, 0, 0, 0]]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  get targetScore(): number { return targetScoreFor(this.playerCount()); }
  get activeNames(): string[] { return this.playerNames().slice(0, this.playerCount()); }
  get activeTotals(): number[] { return this.activeNames.map((_, index) => sumScores(this.rounds(), index)); }
  get isComplete(): boolean { return this.activeTotals.some((score) => score >= this.targetScore); }
  get winner(): string { return determineWinner(this.activeNames, this.rounds().map((round) => round.slice(0, this.playerCount()))); }

  updatePlayerCount(value: number): void {
    this.playerCount.set(Number(value));
  }

  updateName(index: number, value: string): void {
    const names = [...this.playerNames()];
    names[index] = value;
    this.playerNames.set(names);
  }

  updateScore(roundIndex: number, playerIndex: number, value: number): void {
    const rounds = structuredClone(this.rounds());
    rounds[roundIndex][playerIndex] = Number.isFinite(Number(value)) ? Number(value) : 0;
    this.rounds.set(rounds);
  }

  addRound(): void {
    if (this.rounds().length >= 20) return;
    this.rounds.set([...structuredClone(this.rounds()), [0, 0, 0, 0]]);
  }

  removeRound(): void {
    if (this.rounds().length > 1) this.rounds.set(this.rounds().slice(0, -1));
  }

  async saveGame(): Promise<void> {
    const names = this.activeNames.map((name) => name.trim());
    if (names.some((name) => !name)) {
      this.error.set(this.i18n.translate('Enter every player name before saving.'));
      return;
    }
    if (!this.isComplete) {
      this.error.set(this.i18n.translate(
        'At least one player must reach {{count}} points.',
        { count: this.targetScore },
      ));
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      await this.records.saveSeaSaltPaperGame({
        gameSlug: 'sea-salt-paper',
        playerNames: names,
        roundScores: this.rounds().map((round) => round.slice(0, this.playerCount())),
        totals: this.activeTotals,
        targetScore: this.targetScore,
      });
      await this.router.navigateByUrl('/history');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      console.error('Unable to save Sea Salt & Paper game', error);
      this.error.set(
        message.includes('Missing or insufficient permissions')
          ? this.i18n.translate('Firebase rejected this score sheet. Please refresh after the latest update and try again.')
          : message.includes('Nested arrays')
            ? this.i18n.translate('Unable to save this score format. Please refresh and try again.')
            : this.i18n.translate('Unable to save this game. Please try again.'),
      );
    } finally {
      this.saving.set(false);
    }
  }
}
