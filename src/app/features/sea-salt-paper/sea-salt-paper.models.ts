export interface SavedSeaSaltPaperGame {
  id: string;
  ownerUid: string;
  gameSlug: 'sea-salt-paper';
  playerNames: string[];
  playerIds?: Array<string | null>;
  roundScores: number[][];
  totals: number[];
  targetScore: number;
  winnerName: string;
  winnerPlayerId?: string | null;
  completedAt: Date;
  createdAt: Date;
}

export type StoredSeaSaltRound = { scores: number[] };

export function toStoredSeaSaltRounds(rounds: number[][]): StoredSeaSaltRound[] {
  return rounds.map((scores) => ({ scores: [...scores] }));
}

export function fromStoredSeaSaltRounds(rounds: StoredSeaSaltRound[]): number[][] {
  return rounds.map((round) => [...round.scores]);
}

export function targetScoreFor(playerCount: number): number {
  return playerCount === 2 ? 40 : playerCount === 3 ? 35 : 30;
}

export function sumScores(rounds: number[][], playerIndex: number): number {
  return rounds.reduce((sum, round) => sum + (round[playerIndex] ?? 0), 0);
}

export function determineWinner(names: string[], rounds: number[][]): string {
  const winnerIndex = determineWinnerIndex(rounds);
  return winnerIndex === null ? 'Tie' : names[winnerIndex];
}

export function determineWinnerIndex(rounds: number[][]): number | null {
  const namesCount = rounds[0]?.length ?? 0;
  const totals = Array.from({ length: namesCount }, (_, playerIndex) => sumScores(rounds, playerIndex));
  const highest = Math.max(...totals);
  const leaders = totals
    .map((_, index) => ({ index }))
    .filter(({ index }) => totals[index] === highest);
  if (leaders.length === 1) return leaders[0].index;

  const lastRound = rounds.at(-1) ?? [];
  const lastRoundHighest = Math.max(...leaders.map(({ index }) => lastRound[index] ?? 0));
  const finalLeaders = leaders.filter(({ index }) => (lastRound[index] ?? 0) === lastRoundHighest);
  return finalLeaders.length === 1 ? finalLeaders[0].index : null;
}
