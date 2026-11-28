import { SavedGame } from '../games/game-records.service';
import { gamesForPlayer, statsForPlayer } from './player-stats';

describe('player stats', () => {
  const games = [
    {
      gameSlug: 'lost-cities',
      playerNames: ['Ada', 'Guest'],
      playerIds: ['ada', null],
      winnerPlayerId: 'ada',
      roundScores: [],
    },
    {
      gameSlug: 'sea-salt-paper',
      playerNames: ['Ada', 'Grace'],
      playerIds: ['ada', 'grace'],
      winnerPlayerId: 'grace',
      roundScores: [],
    },
    {
      gameSlug: 'lost-cities',
      playerNames: ['Ada', 'Grace'],
      winnerName: 'Ada',
      roundScores: [],
    },
  ] as unknown as SavedGame[];

  it('uses stable player IDs rather than matching display names', () => {
    expect(statsForPlayer('ada', games)).toEqual({
      gamesPlayed: 2,
      gamesWon: 1,
      winRate: 50,
    });
    expect(gamesForPlayer('ada', games)).toHaveSize(2);
  });

  it('returns zero stats for a player with no saved games', () => {
    expect(statsForPlayer('new-player', games)).toEqual({
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
    });
  });
});
