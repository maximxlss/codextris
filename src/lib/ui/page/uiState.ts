import type { GameState } from '$lib/game/types';
import type { UiState } from '$lib/ui/types';

export const createUiState = (state: GameState): UiState => ({
  score: state.score,
  lines: state.lines,
  level: state.level,
  combo: state.combo,
  backToBack: state.backToBack,
  b2bStreak: state.b2bStreak,
  status: state.status,
  modeId: state.mode.id,
  modeElapsedMs: state.mode.elapsedMs,
  modePieces: state.mode.pieces,
  modeEndReason: state.mode.endReason,
  modeStarted: state.mode.started
});
