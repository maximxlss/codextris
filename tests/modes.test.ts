import { describe, expect, it } from 'vitest';
import { createGameState, updateGame } from '../src/lib/game/tetris';
import { EMPTY_PRESSED } from '../src/lib/game/input';
import type { InputSnapshot } from '../src/lib/game/types';
import { DEFAULT_CONFIG } from '../src/lib/game/types';

const makeInput = (
  pressed: Partial<InputSnapshot['pressed']> = {},
  held: Partial<InputSnapshot['held']> = {}
): InputSnapshot => ({
  pressed: { ...EMPTY_PRESSED, ...pressed },
  held: { ...EMPTY_PRESSED, ...held }
});

describe('mode timing and completion', () => {
  it('starts timers on first input when configured', () => {
    const state = createGameState(DEFAULT_CONFIG, 1, undefined, 'sprint40');
    state.status = 'playing';

    updateGame(state, makeInput(), 16);
    expect(state.mode.started).toBe(false);
    expect(state.mode.elapsedMs).toBe(0);

    updateGame(state, makeInput({ left: true }), 16);
    expect(state.mode.started).toBe(true);
    expect(state.mode.elapsedMs).toBe(0);

    updateGame(state, makeInput(), 16);
    expect(state.mode.elapsedMs).toBe(16);
  });

  it('ends blitz on time limit', () => {
    const state = createGameState(DEFAULT_CONFIG, 2, undefined, 'blitz');
    state.status = 'playing';
    state.mode.startOnInput = false;
    state.mode.timeLimitMs = 30;

    updateGame(state, makeInput(), 20);
    expect(state.status).toBe('playing');

    updateGame(state, makeInput(), 20);
    expect(state.status).toBe('results');
    expect(state.mode.endReason).toBe('time');
    expect(state.mode.elapsedMs).toBe(30);
  });

  it('ends sprint when goal lines are met', () => {
    const state = createGameState(DEFAULT_CONFIG, 3, undefined, 'sprint40');
    state.status = 'playing';
    state.mode.startOnInput = false;
    state.mode.goalLines = 0;

    updateGame(state, makeInput({ hardDrop: true }), 16);
    expect(state.status).toBe('results');
    expect(state.mode.endReason).toBe('goal');
  });
});
