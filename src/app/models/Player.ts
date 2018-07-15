export interface Player {
  name: string;
  id: string;
  totalWins: number;
  totalLoses: number;
  winPercentage: number;
  streak: number;
  longestPositiveStreak: number;
  longestNegativeStreak: number;
  eloRank: number;
  totalScoreFor: number;
  totalScoreAgainst: number;
  totalScoreDiff: number;
  history: boolean[];
  tournamentWins: number;
}
