import { BOARD_HEIGHT, BOARD_WIDTH, type ActivePiece, type GameState, type Rotation } from '../types';
import { getPieceCells } from '../pieces';

export const collides = (
  state: GameState,
  piece: ActivePiece,
  offsetX = 0,
  offsetY = 0,
  rotation?: Rotation
): boolean => {
  const cells = getPieceCells(piece.type, rotation ?? piece.rotation);
  for (const cell of cells) {
    const x = piece.x + cell.x + offsetX;
    const y = piece.y + cell.y + offsetY;
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) {
      return true;
    }
    const row = state.board[y];
    if (y >= 0 && row && row[x] !== 0) {
      return true;
    }
  }
  return false;
};

export const tryMove = (state: GameState, dx: number, dy: number): boolean => {
  if (!collides(state, state.active, dx, dy)) {
    state.active.x += dx;
    state.active.y += dy;
    return true;
  }
  return false;
};

export const getGhostY = (state: GameState): number => {
  const ghost = { ...state.active };
  while (!collides(state, ghost, 0, 1)) {
    ghost.y += 1;
  }
  return ghost.y;
};

export const isCellOccupied = (state: GameState, x: number, y: number): boolean => {
  if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return true;
  if (y < 0) return false;
  return (state.board[y]?.[x] ?? 0) !== 0;
};
