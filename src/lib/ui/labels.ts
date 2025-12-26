import type { GameEndReason, GameModeId, GameStatus } from '$lib/game/types';

export const statusLabel = (status: GameStatus): string => {
  switch (status) {
    case 'menu':
      return 'Ready';
    case 'playing':
      return 'Live';
    case 'paused':
      return 'Paused';
    case 'gameover':
      return 'Game Over';
    case 'results':
      return 'Results';
    default:
      return 'Ready';
  }
};

export const modeTagline = (modeId: GameModeId): string => {
  switch (modeId) {
    case 'zen':
      return 'No score, infinite play.';
    case 'sprint40':
      return 'Best time to 40 lines.';
    case 'blitz':
      return '2:00 score attack.';
    default:
      return '';
  }
};

export const endReasonLabel = (reason: GameEndReason | null): string => {
  switch (reason) {
    case 'goal':
      return 'Goal reached';
    case 'time':
      return 'Time up';
    case 'topout':
      return 'Top out';
    case 'quit':
      return 'Ended early';
    default:
      return '';
  }
};
