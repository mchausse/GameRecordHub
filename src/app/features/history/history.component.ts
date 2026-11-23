import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GameRecordsService, SavedGame } from '../../core/games/game-records.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-history',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements OnInit {
  private readonly records = inject(GameRecordsService);
  readonly i18n = inject(I18nService);
  readonly games = signal<SavedGame[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  roundDisplay(game: SavedGame, roundIndex: number): string {
    const round = game.roundScores[roundIndex];
    return Array.isArray(round)
      ? round.join('–')
      : `${round.player1}–${round.player2}`;
  }

  totalDisplay(game: SavedGame): string {
    return Array.isArray(game.totals)
      ? game.totals.join(' – ')
      : `${game.totals.player1} – ${game.totals.player2}`;
  }

  dateDisplay(game: SavedGame): string {
    return this.i18n.formatDate(game.completedAt);
  }

  async ngOnInit(): Promise<void> {
    try {
      this.games.set(await this.records.history());
    } catch {
      this.error.set(this.i18n.translate('Unable to load your game history. Please try again.'));
    } finally {
      this.loading.set(false);
    }
  }
}
