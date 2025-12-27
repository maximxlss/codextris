import type { GameEvents, GameState, InputSnapshot, RotationKick } from '../types';
import { collides, tryMove } from '../physics/collision';
import { createActivePiece, spawnNextPiece } from './active';
import { lockPiece } from './lock';
import { tryRotate, tryRotate180 } from '../physics/rotation';
import { spawnSpinParticles, updateSpinParticles, detectSpin } from '../effects/spin';
import { endMode } from '../modes';

export const hardDrop = (state: GameState): number => {
  let distance = 0;
  while (tryMove(state, 0, 1)) {
    distance += 1;
  }
  return distance;
};

export const gravityForLevel = (baseMs: number, level: number): number => {
  const clampedLevel = Math.max(1, level);
  const scaled = baseMs * Math.pow(0.9, clampedLevel - 1);
  return Math.max(50, Math.round(scaled));
};

const resetFallTimers = (state: GameState) => {
  state.lockTimer = 0;
  state.gravityTimer = 0;
};

const clearRotationState = (state: GameState) => {
  state.lastMoveWasRotation = false;
  state.lastRotationKick = null;
  state.lastRotationPosition = null;
};

const applyHold = (state: GameState): boolean => {
  if (!state.rules.allowHold) {
    return false;
  }
  if (state.holdUsed) {
    return false;
  }
  const current = state.active.type;
  if (state.hold) {
    state.active = createActivePiece(state.hold);
    state.hold = current;
    if (collides(state, state.active)) {
      endMode(state, 'topout');
    }
  } else {
    state.hold = current;
    spawnNextPiece(state);
  }
  state.holdUsed = true;
  resetFallTimers(state);
  clearRotationState(state);
  return true;
};

const applyRotation = (
  state: GameState,
  rotate: () => RotationKick | null,
  spinDir: -1 | 0 | 1,
  events: GameEvents
): boolean => {
  const kick = rotate();
  if (!kick) return false;
  events.rotated = true;
  state.lastMoveWasRotation = true;
  state.lastRotationKick = kick;
  state.lastRotationPosition = { x: state.active.x, y: state.active.y };
  const spinPreview = detectSpin(state);
  if (spinPreview.kind !== 'none') {
    spawnSpinParticles(state, spinDir);
    events.spinPreview = {
      kind: spinPreview.kind,
      lines: 0,
      fullClear: false,
      ...(spinPreview.spinType ? { spinType: spinPreview.spinType } : {})
    };
  }
  return true;
};

const applyHorizontal = (state: GameState, input: InputSnapshot, dt: number): boolean => {
  const cfg = state.config;
  const leftPressed = input.pressed.left;
  const rightPressed = input.pressed.right;
  let pressedDir: 'left' | 'right' | null = null;
  if (leftPressed !== rightPressed) {
    pressedDir = leftPressed ? 'left' : 'right';
  } else if (leftPressed && rightPressed) {
    pressedDir = state.das.lastDir;
  }
  if (pressedDir) {
    state.das.lastDir = pressedDir;
    state.das.dir = pressedDir;
    state.das.delay = 0;
    state.das.repeat = 0;
  }

  let moved = false;
  if (pressedDir === 'left') {
    moved = tryMove(state, -1, 0) || moved;
  } else if (pressedDir === 'right') {
    moved = tryMove(state, 1, 0) || moved;
  }

  const leftHeld = input.held.left;
  const rightHeld = input.held.right;
  let desired: 'left' | 'right' | null = null;
  if (leftHeld && rightHeld) {
    desired = state.das.lastDir;
  } else if (leftHeld) {
    desired = 'left';
  } else if (rightHeld) {
    desired = 'right';
  }

  if (desired !== state.das.dir) {
    state.das.dir = desired;
    state.das.delay = 0;
    state.das.repeat = 0;
  }

  if (state.das.dir) {
    state.das.delay += dt;
    if (state.das.delay >= cfg.dasMs) {
      const arr = cfg.arrMs;
      if (arr === 0) {
        const step = state.das.dir === 'left' ? -1 : 1;
        while (tryMove(state, step, 0)) {
          moved = true;
        }
      } else {
        state.das.repeat += dt;
        const step = state.das.dir === 'left' ? -1 : 1;
        while (state.das.repeat >= arr) {
          if (tryMove(state, step, 0)) {
            moved = true;
            state.das.repeat -= arr;
          } else {
            state.das.repeat = 0;
            break;
          }
        }
      }
    }
  }

  return moved;
};

const TIMER_START_BLOCKED = new Set(['pause', 'restart']);

const inputStartsTimer = (input: InputSnapshot): boolean => {
  return Object.entries(input.pressed).some(
    ([action, active]) => active && !TIMER_START_BLOCKED.has(action)
  );
};

const updateModeTimer = (state: GameState, input: InputSnapshot, dt: number): void => {
  const wasStarted = state.mode.started;
  if (!state.mode.started) {
    if (!state.mode.startOnInput || inputStartsTimer(input)) {
      state.mode.started = true;
    }
  }
  const shouldCount = state.mode.started && (!state.mode.startOnInput || wasStarted);
  if (shouldCount && dt > 0) {
    state.mode.elapsedMs += dt;
    if (state.mode.timeLimitMs !== null && state.mode.elapsedMs >= state.mode.timeLimitMs) {
      state.mode.elapsedMs = state.mode.timeLimitMs;
      endMode(state, 'time');
    }
  }
};

const checkGoalComplete = (state: GameState): void => {
  if (state.mode.goalLines !== null && state.lines >= state.mode.goalLines) {
    endMode(state, 'goal');
  }
};

export const updateGame = (state: GameState, input: InputSnapshot, dt: number): GameEvents => {
  const events: GameEvents = {};
  if (state.status !== 'playing') {
    return events;
  }

  updateModeTimer(state, input, dt);
  if (state.status !== 'playing') {
    return events;
  }

  if (input.pressed.softDrop) {
    state.gravityTimer = 0;
  }

  let movedOrRotated = false;

  if (input.pressed.hold) {
    if (applyHold(state)) {
      events.hold = true;
      movedOrRotated = true;
    }
  }
  if (state.status !== 'playing') {
    return events;
  }

  if (input.pressed.rotateCW) {
    movedOrRotated = applyRotation(state, () => tryRotate(state, 1), 1, events) || movedOrRotated;
  }
  if (input.pressed.rotateCCW) {
    movedOrRotated = applyRotation(state, () => tryRotate(state, -1), -1, events) || movedOrRotated;
  }
  if (state.rules.allowRotate180 && input.pressed.rotate180) {
    movedOrRotated = applyRotation(state, () => tryRotate180(state), 0, events) || movedOrRotated;
  }

  const movedHoriz = applyHorizontal(state, input, dt);
  if (movedHoriz) {
    events.moved = true;
    movedOrRotated = true;
    clearRotationState(state);
  }

  if (state.rules.allowHardDrop && input.pressed.hardDrop) {
    hardDrop(state);
    events.hardDrop = true;
    const lockResult = lockPiece(state);
    events.locked = true;
    events.lockResult = lockResult;
    resetFallTimers(state);
    checkGoalComplete(state);
    return events;
  }

  const levelGravity = gravityForLevel(state.config.gravityMs, state.level);
  const softDropInstant = input.held.softDrop && state.config.softDropFactor <= 0;
  const gravityInterval =
    input.held.softDrop && !softDropInstant
      ? Math.max(1, levelGravity / state.config.softDropFactor)
      : levelGravity;

  let softDropMoved = false;
  let gravityMoved = false;
  if (softDropInstant) {
    while (tryMove(state, 0, 1)) {
      movedOrRotated = true;
      softDropMoved = true;
    }
    state.gravityTimer = 0;
  } else {
    state.gravityTimer += dt;
    while (state.gravityTimer >= gravityInterval) {
      state.gravityTimer -= gravityInterval;
      if (!tryMove(state, 0, 1)) {
        break;
      } else {
        movedOrRotated = true;
        gravityMoved = true;
        if (input.held.softDrop) {
          softDropMoved = true;
        }
      }
    }
  }

  if (softDropMoved || gravityMoved) {
    clearRotationState(state);
  }

  const grounded = collides(state, state.active, 0, 1);
  if (grounded) {
    state.lockTimer += dt;
    if (movedOrRotated) {
      state.lockTimer = 0;
    }
    if (state.lockTimer >= state.config.lockDelayMs) {
      const lockResult = lockPiece(state);
      events.locked = true;
      events.lockResult = lockResult;
      resetFallTimers(state);
      checkGoalComplete(state);
    }
  } else {
    state.lockTimer = 0;
  }

  if (state.effects.lineFlash > 0) {
    state.effects.lineFlash = Math.max(0, state.effects.lineFlash - dt / 180);
  }
  if (state.effects.shake > 0) {
    state.effects.shake = Math.max(0, state.effects.shake - dt / 250);
  }
  updateSpinParticles(state, dt);

  return events;
};
