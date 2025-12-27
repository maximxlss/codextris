import { HIDDEN_ROWS, type ActivePiece, type GameState, type PieceType, type Rotation } from '../types';
import { getPieceCells } from '../pieces';
import { nextBag } from '../random';
import { collides } from '../physics/collision';
import { endMode } from '../modes';

const SPAWN_X = 4;
const SPAWN_Y = HIDDEN_ROWS;

export const createActivePiece = (type: PieceType): ActivePiece => ({
  type,
  rotation: 0,
  x: SPAWN_X,
  y: SPAWN_Y
});

const refillQueue = (state: GameState): void => {
  if (state.queue.length < 7) {
    state.queue.push(...nextBag(state.rng));
  }
};

export const spawnNextPiece = (state: GameState): boolean => {
  refillQueue(state);
  const next = state.queue.shift();
  if (!next) {
    return false;
  }
  state.active = createActivePiece(next);
  state.holdUsed = false;
  state.lockTimer = 0;
  state.gravityTimer = 0;
  state.lastMoveWasRotation = false;
  state.lastRotationKick = null;
  state.lastRotationPosition = null;
  if (collides(state, state.active)) {
    endMode(state, 'topout');
    return false;
  }
  return true;
};

export const getPieceBlocks = (piece: ActivePiece, rotation: Rotation = piece.rotation) => {
  const cells = getPieceCells(piece.type, rotation);
  return cells.map((cell) => ({ x: piece.x + cell.x, y: piece.y + cell.y }));
};
