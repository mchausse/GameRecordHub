import { SavedGame } from '../games/game-records.service';
import { PlayerStats } from './player.models';

export function statsForPlayer(playerId: string, games: SavedGame[]): PlayerStats {
  const gamesPlayed = games.filter((game) => game.playerIds?.includes(playerId)).length;
  const gamesWon = games.filter((game) => game.winnerPlayerId === playerId).length;
  return {
    gamesPlayed,
    gamesWon,
    winRate: gamesPlayed === 0 ? 0 : Math.round((gamesWon / gamesPlayed) * 100),
  };
}

export function gamesForPlayer(playerId: string, games: SavedGame[]): SavedGame[] {
  return games.filter((game) => game.playerIds?.includes(playerId));
}
