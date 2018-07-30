export interface Game {
  gameId: string;
  firstPlayerName: string;
  secondPlayerName: string;
  firstPlayerId: string;
  secondPlayerId: string;
  firstPlayerScore: number;
  secondPlayerScore: number;
  timestamp: number;
  done: boolean;
  mode: 'regular' | 'knockout' | 'league';
  shouldEffectRank: boolean;
  shouldEffectElo: boolean;
  tournamentId: string;
  startTimestamp: number;
  teamId: string;
}
