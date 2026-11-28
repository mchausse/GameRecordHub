export type ExpeditionId = 'yellow' | 'blue' | 'red' | 'green' | 'white' | 'purple';
export type LostCitiesExpeditionCount = 5 | 6;

export interface ExpeditionScoreInput {
  values: number[];
  investments: number;
}

export interface LostCitiesRound {
  player1: Record<ExpeditionId, ExpeditionScoreInput>;
  player2: Record<ExpeditionId, ExpeditionScoreInput>;
}

export interface SavedLostCitiesGame {
  id: string;
  ownerUid: string;
  gameSlug: 'lost-cities';
  expeditionCount?: LostCitiesExpeditionCount;
  playerNames: [string, string];
  playerIds?: [string | null, string | null];
  roundScores: [
    { player1: number; player2: number },
    { player1: number; player2: number },
    { player1: number; player2: number },
  ];
  totals: { player1: number; player2: number };
  winnerName: string;
  winnerPlayerId?: string | null;
  completedAt: Date;
  createdAt: Date;
}

export const EXPEDITIONS: ReadonlyArray<{ id: ExpeditionId; name: string; symbol: string }> = [
  { id: 'yellow', name: 'Desert', symbol: '☀' },
  { id: 'blue', name: 'Neptune’s Realm', symbol: '≈' },
  { id: 'red', name: 'Volcanoes', symbol: '▲' },
  { id: 'green', name: 'Rainforest', symbol: '♧' },
  { id: 'white', name: 'Himalayas', symbol: '❄' },
  { id: 'purple', name: 'Purple Cities', symbol: '◆' },
];

export const CARD_VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function emptyExpedition(): ExpeditionScoreInput {
  return { values: [], investments: 0 };
}

export function emptyRound(): LostCitiesRound {
  const expeditions = () => ({
    yellow: emptyExpedition(),
    blue: emptyExpedition(),
    red: emptyExpedition(),
    green: emptyExpedition(),
    white: emptyExpedition(),
    purple: emptyExpedition(),
  });
  return { player1: expeditions(), player2: expeditions() };
}

export function expeditionsForCount(count: LostCitiesExpeditionCount) {
  return count === 5 ? EXPEDITIONS.slice(0, 5) : EXPEDITIONS;
}

export function scoreExpedition(input: ExpeditionScoreInput): number {
  const cardCount = input.values.length + input.investments;
  if (cardCount === 0) return 0;
  const valueTotal = input.values.reduce((sum, value) => sum + value, 0);
  const multiplier = 1 + input.investments;
  const expeditionBonus = cardCount >= 8 ? 20 : 0;
  return (valueTotal - 20) * multiplier + expeditionBonus;
}
