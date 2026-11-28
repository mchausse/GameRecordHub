import { determineWinner, determineWinnerIndex, fromStoredSeaSaltRounds, sumScores, targetScoreFor, toStoredSeaSaltRounds } from './sea-salt-paper.models';

describe('Sea Salt & Paper scoring', () => {
  it('uses the official target by player count', () => {
    expect(targetScoreFor(2)).toBe(40);
    expect(targetScoreFor(3)).toBe(35);
    expect(targetScoreFor(4)).toBe(30);
  });

  it('sums a player’s round scores', () => {
    expect(sumScores([[4, 6], [10, 7], [5, 8]], 1)).toBe(21);
  });

  it('breaks a tied final total by the final-round score', () => {
    expect(determineWinner(['A', 'B'], [[30, 20], [5, 15]])).toBe('B');
    expect(determineWinnerIndex([[30, 20], [5, 15]])).toBe(1);
  });

  it('returns no winner ID when the final-round tie breaker is also tied', () => {
    expect(determineWinnerIndex([[20, 20, 20], [10, 10, 10]])).toBeNull();
  });

  it('stores rounds as maps containing flat arrays for Firestore compatibility', () => {
    const stored = toStoredSeaSaltRounds([[3, 7], [12, 9]]);
    expect(stored).toEqual([{ scores: [3, 7] }, { scores: [12, 9] }]);
    expect(stored[0]).not.toBe(stored[1]);
  });

  it('restores stored round maps into client score arrays', () => {
    expect(fromStoredSeaSaltRounds([{ scores: [3, 7] }, { scores: [12, 9] }])).toEqual([[3, 7], [12, 9]]);
  });

  it('preserves every player in three- and four-player Firestore records', () => {
    const threePlayers = toStoredSeaSaltRounds([[3, 7, 5], [12, 9, 14]]);
    const fourPlayers = toStoredSeaSaltRounds([[3, 7, 5, 18], [12, 9, 14, 4]]);

    expect(fromStoredSeaSaltRounds(threePlayers)).toEqual([[3, 7, 5], [12, 9, 14]]);
    expect(fromStoredSeaSaltRounds(fourPlayers)).toEqual([[3, 7, 5, 18], [12, 9, 14, 4]]);
  });
});
