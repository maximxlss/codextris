import type { GameState, LockResult, LockResultKind } from '../types';
import { PIECE_INDEX } from '../pieces';
import { clearLines, isBoardEmpty } from '../board/board';
import { getPieceBlocks, spawnNextPiece } from './active';
import { detectSpin } from '../effects/spin';
import { computeScoreBreakdown } from '../scoring';
import { endMode } from '../modes';

const isBackToBackEligible = (
  kind: LockResultKind,
  lines: number,
  fullClear: boolean
): boolean => {
  if (lines <= 0) return false;
  if (fullClear) return true;
  if (lines === 4) return true;
  return kind === 'tspin' || kind === 'tspin-mini' || kind === 'spin' || kind === 'spin-mini';
};

export const lockPiece = (state: GameState): LockResult => {
  const blocks = getPieceBlocks(state.active);
  for (const block of blocks) {
    if (block.y < 0) {
      endMode(state, 'topout');
      return { kind: 'none', lines: 0, fullClear: false };
    }
  }
  const spin = detectSpin(state);
  state.mode.pieces += 1;
  for (const block of blocks) {
    const row = state.board[block.y];
    if (row) {
      row[block.x] = PIECE_INDEX[state.active.type];
    }
  }
  const cleared = clearLines(state);
  const fullClear = cleared > 0 && isBoardEmpty(state);
  const kind: LockResultKind = spin.kind !== 'none' ? spin.kind : cleared > 0 ? 'line' : 'none';

  let combo = state.combo;
  let comboResult: number | undefined;
  if (cleared > 0) {
    combo = combo < 0 ? 0 : combo + 1;
    comboResult = combo;
  } else {
    combo = -1;
  }

  let backToBack = state.backToBack;
  let b2bStreak = state.b2bStreak;
  let backToBackResult: boolean | undefined;
  const wasBackToBack = backToBack;
  let backToBackEligible = false;
  if (cleared > 0 || kind !== 'none') {
    backToBackEligible = isBackToBackEligible(kind, cleared, fullClear);
    if (backToBackEligible) {
      backToBackResult = backToBack;
      backToBack = true;
      b2bStreak = wasBackToBack ? b2bStreak + 1 : 1;
    } else if (cleared > 0) {
      backToBack = false;
      b2bStreak = 0;
    }
  }

  state.combo = combo;
  state.backToBack = backToBack;
  state.b2bStreak = b2bStreak;

  const lockResult: LockResult = {
    kind,
    lines: cleared,
    fullClear,
    ...(spin.spinType ? { spinType: spin.spinType } : {}),
    ...(comboResult !== undefined ? { combo: comboResult } : {}),
    ...(backToBackResult !== undefined ? { backToBack: backToBackResult } : {})
  };

  if (cleared > 0 || kind === 'tspin' || kind === 'tspin-mini' || kind === 'spin' || kind === 'spin-mini') {
    state.lines += cleared;
    const scoreBreakdown = computeScoreBreakdown({
      kind,
      lines: cleared,
      combo: comboResult,
      backToBackEligible,
      wasBackToBack,
      fullClear,
      rules: state.rules
    });
    if (scoreBreakdown) {
      state.score += scoreBreakdown.total;
      lockResult.score = scoreBreakdown;
    }
    const linesPerLevel = Math.max(1, state.rules.linesPerLevel);
    state.level = 1 + Math.floor(state.lines / linesPerLevel);
    if (kind === 'tspin' || kind === 'tspin-mini' || kind === 'spin' || kind === 'spin-mini') {
      if (cleared === 0) {
        state.effects.shake = Math.min(1, state.effects.shake + 0.35);
      }
    }
    if (cleared > 0) {
      state.effects.lineFlash = 0.7;
      state.effects.shake = Math.min(1, state.effects.shake + 0.7);
    }
  }
  spawnNextPiece(state);
  return lockResult;
};
