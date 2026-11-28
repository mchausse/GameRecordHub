import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { GameRecordsService, SavedGame } from '../../core/games/game-records.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { PlayerStats, SavedPlayer } from '../../core/players/player.models';
import { gamesForPlayer, statsForPlayer } from '../../core/players/player-stats';
import { PlayersService } from '../../core/players/players.service';

@Component({
  selector: 'app-players',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './players.component.html',
  styleUrl: './players.component.scss',
})
export class PlayersComponent implements OnInit {
  private readonly playersService = inject(PlayersService);
  private readonly records = inject(GameRecordsService);
  readonly i18n = inject(I18nService);
  readonly players = signal<SavedPlayer[]>([]);
  readonly games = signal<SavedGame[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedPlayerId = signal<string | null>(null);
  readonly draftNames = signal<Record<string, string>>({});
  newPlayerName = '';

  async ngOnInit(): Promise<void> {
    try {
      const [players, games] = await Promise.all([
        this.playersService.list(),
        this.records.history(),
      ]);
      this.players.set(players);
      this.games.set(games);
      this.selectedPlayerId.set(players[0]?.id ?? null);
      this.draftNames.set(Object.fromEntries(players.map((player) => [player.id, player.name])));
    } catch {
      this.error.set(this.i18n.translate('Unable to load your saved players. Please try again.'));
    } finally {
      this.loading.set(false);
    }
  }

  stats(playerId: string): PlayerStats {
    return statsForPlayer(playerId, this.games());
  }

  selectedGames(): SavedGame[] {
    const playerId = this.selectedPlayerId();
    return playerId ? gamesForPlayer(playerId, this.games()) : [];
  }

  selectedPlayerName(): string {
    const playerId = this.selectedPlayerId();
    return this.players().find((player) => player.id === playerId)?.name ?? '';
  }

  selectPlayer(playerId: string): void {
    this.selectedPlayerId.set(playerId);
  }

  updateDraft(playerId: string, name: string): void {
    this.draftNames.set({ ...this.draftNames(), [playerId]: name });
  }

  async createPlayer(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      const id = await this.playersService.create({ name: this.newPlayerName });
      await this.refreshPlayers(id);
      this.newPlayerName = '';
    } catch (error) {
      this.error.set(error instanceof Error ? this.i18n.translate(error.message) : this.i18n.translate('Unable to create this player. Please try again.'));
    } finally {
      this.saving.set(false);
    }
  }

  async renamePlayer(playerId: string): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.playersService.rename(playerId, this.draftNames()[playerId] ?? '');
      await this.refreshPlayers(playerId);
    } catch (error) {
      this.error.set(error instanceof Error ? this.i18n.translate(error.message) : this.i18n.translate('Unable to rename this player. Please try again.'));
    } finally {
      this.saving.set(false);
    }
  }

  gameResult(game: SavedGame, playerId: string): string {
    return game.winnerPlayerId === playerId
      ? this.i18n.translate('Won')
      : game.winnerPlayerId === null
        ? this.i18n.translate('Tied')
        : this.i18n.translate('Played');
  }

  private async refreshPlayers(selectedId: string): Promise<void> {
    const players = await this.playersService.list();
    this.players.set(players);
    this.selectedPlayerId.set(selectedId);
    this.draftNames.set(Object.fromEntries(players.map((player) => [player.id, player.name])));
  }
}
