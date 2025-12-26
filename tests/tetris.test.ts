import { describe, expect, it } from 'vitest';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEFAULT_CONFIG,
  HIDDEN_ROWS,
  type ActivePiece,
  type Rotation
} from '../src/lib/game/types';
import { getPieceCells } from '../src/lib/game/pieces';
import { getKickTests } from '../src/lib/game/srs';
import {
  clearLines,
  collides,
  createEmptyBoard,
  createGameState,
  hardDrop,
  tryRotate,
  tryRotate180
} from '../src/lib/game/tetris';

const fillRow = () => Array.from({ length: BOARD_WIDTH }, () => 1);

describe('tetris core', () => {
  it('clears completed lines', () => {
    const state = createGameState(DEFAULT_CONFIG, 1);
    state.board = createEmptyBoard();
    state.board[BOARD_HEIGHT - 1] = fillRow();
    state.board[BOARD_HEIGHT - 2] = fillRow();
    const thirdRow = state.board[BOARD_HEIGHT - 3]!;
    thirdRow[0] = 2;

    const cleared = clearLines(state);
    expect(cleared).toBe(2);
    const topRow = state.board[0]!;
    expect(topRow.every((cell) => cell === 0)).toBe(true);
    const bottomRow = state.board[BOARD_HEIGHT - 1]!;
    expect(bottomRow[0]).toBe(2);
  });

  it('uses SRS kicks when rotation is blocked', () => {
    const state = createGameState(DEFAULT_CONFIG, 2);
    state.status = 'playing';
    state.board = createEmptyBoard();
    const topRow = state.board[0]!;
    topRow[2] = 9;
    state.active = { type: 'T', rotation: 0, x: 2, y: 1 } as ActivePiece;

    const rotated = tryRotate(state, 1);
    expect(rotated).not.toBeNull();
    expect(state.active.rotation).toBe(1);
    expect(state.active.x).toBe(1);
    expect(rotated?.x).toBe(-1);
  });

  it('hard drop lands on the stack', () => {
    const state = createGameState(DEFAULT_CONFIG, 3);
    state.status = 'playing';
    state.board = createEmptyBoard();
    hardDrop(state);
    expect(collides(state, state.active, 0, 1)).toBe(true);
  });

  it('rotates pieces 180 degrees using two SRS turns', () => {
    const state = createGameState(DEFAULT_CONFIG, 6);
    state.status = 'playing';
    state.board = createEmptyBoard();
    state.active = { type: 'T', rotation: 0, x: 4, y: 1 } as ActivePiece;

    const rotated = tryRotate180(state);
    expect(rotated).not.toBeNull();
    expect(state.active.rotation).toBe(2);
  });

  it('spawns pieces so they are immediately visible', () => {
    const state = createGameState(DEFAULT_CONFIG, 4);
    expect(state.active.y).toBe(HIDDEN_ROWS);
  });
});

describe('SRS reference checks', () => {
  it('uses guideline spawn orientations for each piece', () => {
    const expected = {
      I: [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ],
      J: [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -1, y: -1 }
      ],
      L: [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: -1 }
      ],
      O: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: -1 },
        { x: 1, y: -1 }
      ],
      S: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -1, y: -1 },
        { x: 0, y: -1 }
      ],
      T: [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: -1 }
      ],
      Z: [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: -1 },
        { x: 1, y: -1 }
      ]
    } as const;

    (Object.keys(expected) as Array<keyof typeof expected>).forEach((type) => {
      expect(getPieceCells(type, 0)).toEqual(expected[type]);
    });
  });

  it('matches SRS wall kick data for JLSTZ (Y inverted for screen coords)', () => {
    const cases: Array<[Rotation, Rotation, { x: number; y: number }[]]> = [
      [0, 1, [
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: -1, y: -1 },
        { x: 0, y: 2 },
        { x: -1, y: 2 }
      ]],
      [1, 0, [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: -2 },
        { x: 1, y: -2 }
      ]],
      [1, 2, [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: -2 },
        { x: 1, y: -2 }
      ]],
      [2, 1, [
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: -1, y: -1 },
        { x: 0, y: 2 },
        { x: -1, y: 2 }
      ]],
      [2, 3, [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: -1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 }
      ]],
      [3, 2, [
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: -2 },
        { x: -1, y: -2 }
      ]],
      [3, 0, [
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: -2 },
        { x: -1, y: -2 }
      ]],
      [0, 3, [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: -1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 }
      ]]
    ];

    cases.forEach(([from, to, expected]) => {
      expect(getKickTests('T', from, to)).toEqual(expected);
    });
  });

  it('matches SRS wall kick data for I (Y inverted for screen coords)', () => {
    const cases: Array<[Rotation, Rotation, { x: number; y: number }[]]> = [
      [0, 1, [
        { x: 0, y: 0 },
        { x: -2, y: 0 },
        { x: 1, y: 0 },
        { x: -2, y: 1 },
        { x: 1, y: -2 }
      ]],
      [1, 0, [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: -1, y: 0 },
        { x: 2, y: -1 },
        { x: -1, y: 2 }
      ]],
      [1, 2, [
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: 2, y: 0 },
        { x: -1, y: -2 },
        { x: 2, y: 1 }
      ]],
      [2, 1, [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -2, y: 0 },
        { x: 1, y: 2 },
        { x: -2, y: -1 }
      ]],
      [2, 3, [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: -1, y: 0 },
        { x: 2, y: -1 },
        { x: -1, y: 2 }
      ]],
      [3, 2, [
        { x: 0, y: 0 },
        { x: -2, y: 0 },
        { x: 1, y: 0 },
        { x: -2, y: 1 },
        { x: 1, y: -2 }
      ]],
      [3, 0, [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -2, y: 0 },
        { x: 1, y: 2 },
        { x: -2, y: -1 }
      ]],
      [0, 3, [
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: 2, y: 0 },
        { x: -1, y: -2 },
        { x: 2, y: 1 }
      ]]
    ];

    cases.forEach(([from, to, expected]) => {
      expect(getKickTests('I', from, to)).toEqual(expected);
    });
  });
});
