export interface Player {
  name: string;
  id: string;
  totalWins: number;
  totalLoses: number;
  winPercentage: number;
  streak: number;
  eloRank : number;
}
