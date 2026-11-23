export interface SavedSeaSaltPaperGame {
  id: string;
  ownerUid: string;
  gameSlug: 'sea-salt-paper';
  playerNames: string[];
  roundScores: number[][];
  totals: number[];
  targetScore: number;
  winnerName: string;
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
  const totals = names.map((_, playerIndex) => sumScores(rounds, playerIndex));
  const highest = Math.max(...totals);
  const leaders = names
    .map((name, index) => ({ name, index }))
    .filter(({ index }) => totals[index] === highest);
  if (leaders.length === 1) return leaders[0].name;

  const lastRound = rounds.at(-1) ?? [];
  const lastRoundHighest = Math.max(...leaders.map(({ index }) => lastRound[index] ?? 0));
  const finalLeaders = leaders.filter(({ index }) => (lastRound[index] ?? 0) === lastRoundHighest);
  return finalLeaders.length === 1 ? finalLeaders[0].name : 'Tie';
}
