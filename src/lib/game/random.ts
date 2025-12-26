import type { PieceType, RngState } from './types';
import { PIECE_TYPES } from './pieces';

export const createRng = (seed = Date.now()): RngState => ({
  seed: seed >>> 0
});

export const nextRandom = (rng: RngState): number => {
  rng.seed = (rng.seed * 1664525 + 1013904223) >>> 0;
  return rng.seed / 0x100000000;
};

export const nextBag = (rng: RngState): PieceType[] => {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRandom(rng) * (i + 1));
    const temp = bag[i]!;
    bag[i] = bag[j]!;
    bag[j] = temp;
  }
  return bag;
};
