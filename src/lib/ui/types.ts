import type { GameEndReason, GameModeId, GameStatus } from '$lib/game/types';

export type UiState = {
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  b2bStreak: number;
  status: GameStatus;
  modeId: GameModeId;
  modeElapsedMs: number;
  modePieces: number;
  modeEndReason: GameEndReason | null;
  modeStarted: boolean;
};
