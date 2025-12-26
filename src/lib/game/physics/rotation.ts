import type { GameState, Rotation, RotationKick } from '../types';
import { getKickTests, getKickTests180 } from '../srs';
import { collides } from './collision';

const applyRotation = (state: GameState, direction: 1 | -1): RotationKick | null => {
  const from = state.active.rotation;
  const to = (((from + direction) % 4) + 4) % 4 as Rotation;
  const kicks = getKickTests(state.active.type, from, to);
  for (let index = 0; index < kicks.length; index += 1) {
    const kick = kicks[index]!;
    if (!collides(state, state.active, kick.x, kick.y, to)) {
      state.active.rotation = to;
      state.active.x += kick.x;
      state.active.y += kick.y;
      return { x: kick.x, y: kick.y, index };
    }
  }
  return null;
};

export const tryRotate = (state: GameState, direction: 1 | -1): RotationKick | null => {
  return applyRotation(state, direction);
};

export const tryRotate180 = (state: GameState): RotationKick | null => {
  const from = state.active.rotation;
  const to = (((from + 2) % 4) + 4) % 4 as Rotation;
  const kicks = getKickTests180(state.active.type);
  for (let index = 0; index < kicks.length; index += 1) {
    const kick = kicks[index]!;
    if (!collides(state, state.active, kick.x, kick.y, to)) {
      state.active.rotation = to;
      state.active.x += kick.x;
      state.active.y += kick.y;
      return { x: kick.x, y: kick.y, index };
    }
  }
  return null;
};
