export interface SavedPlayer {
  id: string;
  ownerUid: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewSavedPlayer {
  name: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
}
