import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GameRecordsService, SavedGame } from '../../core/games/game-records.service';

@Component({
  selector: 'app-history',
  imports: [DatePipe, RouterLink],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements OnInit {
  private readonly records = inject(GameRecordsService);
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

  async ngOnInit(): Promise<void> {
    try {
      this.games.set(await this.records.history());
    } catch {
      this.error.set('Unable to load your game history. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
