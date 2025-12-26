import { BOARD_HEIGHT, BOARD_WIDTH, type GameState } from '../types';

export const createEmptyBoard = (): number[][] => {
  return Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => 0));
};

export const isBoardEmpty = (state: GameState): boolean => {
  return state.board.every((row) => row.every((cell) => cell === 0));
};

export const clearLines = (state: GameState): number => {
  let cleared = 0;
  const newBoard: number[][] = [];
  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    const row = state.board[y];
    if (!row) {
      continue;
    }
    if (row.every((cell) => cell !== 0)) {
      cleared += 1;
    } else {
      newBoard.push([...row]);
    }
  }
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array.from({ length: BOARD_WIDTH }, () => 0));
  }
  state.board = newBoard;
  return cleared;
};
