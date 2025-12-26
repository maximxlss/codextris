import type { Action, InputSnapshot } from './types';

const ACTIONS: Action[] = [
  'left',
  'right',
  'softDrop',
  'hardDrop',
  'rotateCW',
  'rotateCCW',
  'rotate180',
  'hold',
  'pause',
  'restart'
];

const createActionRecord = (initial: boolean): Record<Action, boolean> => {
  return ACTIONS.reduce((acc, action) => {
    acc[action] = initial;
    return acc;
  }, {} as Record<Action, boolean>);
};

export const EMPTY_PRESSED = createActionRecord(false);

export class InputController {
  private held = createActionRecord(false);
  private pressed = createActionRecord(false);

  get snapshot(): InputSnapshot {
    return {
      held: { ...this.held },
      pressed: { ...this.pressed }
    };
  }

  reset(): void {
    this.held = createActionRecord(false);
    this.pressed = createActionRecord(false);
  }

  handleKeyDown(action: Action, repeat: boolean): void {
    if (!repeat && !this.held[action]) {
      this.pressed[action] = true;
    }
    this.held[action] = true;
  }

  handleKeyUp(action: Action): void {
    this.held[action] = false;
  }

  consume(): InputSnapshot {
    const snapshot = this.snapshot;
    this.pressed = createActionRecord(false);
    return snapshot;
  }
}

export const defaultKeyMap: Record<string, Action | null> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'softDrop',
  Space: 'hardDrop',
  ArrowUp: 'rotateCW',
  KeyX: 'rotateCW',
  KeyZ: 'rotateCCW',
  KeyA: 'rotate180',
  KeyC: 'hold',
  ShiftLeft: 'hold',
  ShiftRight: 'hold',
  KeyP: 'pause',
  Escape: 'pause',
  KeyR: 'restart',
  // WASD disabled by default to free A for 180 rotation.
};
