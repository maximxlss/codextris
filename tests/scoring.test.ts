import { describe, expect, it } from 'vitest';
import type { ActivePiece } from '../src/lib/game/types';
import { BOARD_HEIGHT, BOARD_WIDTH, DEFAULT_CONFIG, DEFAULT_RULES } from '../src/lib/game/types';
import { createEmptyBoard } from '../src/lib/game/board/board';
import { getPieceCells } from '../src/lib/game/pieces';
import { createGameState } from '../src/lib/game/tetris';
import { lockPiece } from '../src/lib/game/core/lock';

const prepareTetrisClear = (state: ReturnType<typeof createGameState>) => {
  state.board = createEmptyBoard();

  const rotation = 1;
  const cells = getPieceCells('I', rotation);
  const minX = Math.min(...cells.map((cell) => cell.x));
  const maxX = Math.max(...cells.map((cell) => cell.x));
  const maxY = Math.max(...cells.map((cell) => cell.y));

  let pieceX = 4;
  if (pieceX + minX < 0) pieceX = -minX;
  if (pieceX + maxX >= BOARD_WIDTH) pieceX = BOARD_WIDTH - 1 - maxX;

  const pieceY = BOARD_HEIGHT - 1 - maxY;
  const blocks = cells.map((cell) => ({ x: pieceX + cell.x, y: pieceY + cell.y }));

  const rows = Array.from(new Set(blocks.map((block) => block.y)));
  rows.forEach((row) => {
    const filled = Array.from({ length: BOARD_WIDTH }, () => 1);
    blocks.filter((block) => block.y === row).forEach((block) => {
      filled[block.x] = 0;
    });
    state.board[row] = filled;
  });

  state.active = {
    type: 'I',
    rotation,
    x: pieceX,
    y: pieceY
  } as ActivePiece;
};

const prepareSingleFullClear = (state: ReturnType<typeof createGameState>) => {
  state.board = createEmptyBoard();
  const bottom = Array.from({ length: BOARD_WIDTH }, () => 1);
  const holes = [3, 4, 5, 6];
  holes.forEach((x) => {
    bottom[x] = 0;
  });
  state.board[BOARD_HEIGHT - 1] = bottom;
  state.active = {
    type: 'I',
    rotation: 0,
    x: 4,
    y: BOARD_HEIGHT - 1
  } as ActivePiece;
};

describe('scoring modifiers', () => {
  it('applies back-to-back and combo bonuses on consecutive tetrises', () => {
    const state = createGameState(DEFAULT_CONFIG, 1, DEFAULT_RULES);
    state.status = 'playing';

    prepareTetrisClear(state);
    const first = lockPiece(state);
    expect(first.lines).toBe(4);
    const tetrisScore = DEFAULT_RULES.lineScores[4]!;
    const firstTotal = tetrisScore + DEFAULT_RULES.fullClearBonus;
    expect(state.score).toBe(firstTotal);

    prepareTetrisClear(state);
    const second = lockPiece(state);
    expect(second.lines).toBe(4);

    const comboMultiplier =
      1 + (DEFAULT_RULES.comboMaxMultiplier - 1) * (1 - Math.exp(-DEFAULT_RULES.comboCurve));
    const expectedSecondBase = Math.round(
      tetrisScore * DEFAULT_RULES.backToBackMultiplier * comboMultiplier
    );
    expect(state.score).toBe(firstTotal + expectedSecondBase + DEFAULT_RULES.fullClearBonus);
  });

  it('awards full clear bonus and counts toward back-to-back', () => {
    const state = createGameState(DEFAULT_CONFIG, 7, DEFAULT_RULES);
    state.status = 'playing';

    prepareSingleFullClear(state);
    const first = lockPiece(state);
    expect(first.fullClear).toBe(true);
    expect(state.backToBack).toBe(true);
    expect(first.score?.fullClearBonus).toBe(DEFAULT_RULES.fullClearBonus);
    const singleScore = DEFAULT_RULES.lineScores[1]!;
    expect(state.score).toBe(singleScore + DEFAULT_RULES.fullClearBonus);
  });
});
