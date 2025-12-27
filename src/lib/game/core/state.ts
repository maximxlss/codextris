import { createActivePiece, spawnNextPiece } from './active';
import { createEmptyBoard } from '../board/board';
import { createRng } from '../random';
import { DEFAULT_SPIN_CONFIG } from '../effects/spin';
import type { GameConfig, GameModeId, GameRules, GameState } from '../types';
import { DEFAULT_CONFIG, DEFAULT_RULES } from '../types';
import { createModeState, DEFAULT_MODE_ID, getModeById, resolveModeConfig } from '../modes';

export const createGameState = (
  config: GameConfig = DEFAULT_CONFIG,
  seed?: number,
  rules?: GameRules,
  modeId: GameModeId = DEFAULT_MODE_ID
): GameState => {
  const mode = getModeById(modeId);
  const resolvedConfig = resolveModeConfig(config, mode.id);
  const resolvedRules = rules ?? mode.rules ?? DEFAULT_RULES;
  const rngSeed = seed ?? Date.now();
  const rng = createRng(rngSeed);
  const state: GameState = {
    board: createEmptyBoard(),
    active: createActivePiece('T'),
    queue: [],
    hold: null,
    holdUsed: false,
    status: 'menu',
    score: 0,
    lines: 0,
    level: 1,
    combo: -1,
    backToBack: false,
    b2bStreak: 0,
    gravityTimer: 0,
    lockTimer: 0,
    effects: { lineFlash: 0, shake: 0, spinParticles: [], spinConfig: { ...DEFAULT_SPIN_CONFIG } },
    das: { dir: null, delay: 0, repeat: 0, lastDir: null },
    config: { ...resolvedConfig },
    seed: rngSeed,
    rules: { ...resolvedRules },
    mode: createModeState(mode.id),
    rng,
    lastMoveWasRotation: false,
    lastRotationKick: null,
    lastRotationPosition: null
  };
  spawnNextPiece(state);
  return state;
};

export const resetGame = (
  state: GameState,
  config: GameConfig,
  options?: { rules?: GameRules; modeId?: GameModeId; seed?: number }
): void => {
  const nextModeId = options?.modeId ?? state.mode?.id ?? DEFAULT_MODE_ID;
  const mode = getModeById(nextModeId);
  const nextRules = options?.rules ?? mode.rules ?? state.rules ?? DEFAULT_RULES;
  const resolvedConfig = resolveModeConfig(config, mode.id);
  const rngSeed = options?.seed ?? Date.now();
  state.board = createEmptyBoard();
  state.queue = [];
  state.hold = null;
  state.holdUsed = false;
  state.status = 'playing';
  state.score = 0;
  state.lines = 0;
  state.level = 1;
  state.combo = -1;
  state.backToBack = false;
  state.b2bStreak = 0;
  state.gravityTimer = 0;
  state.lockTimer = 0;
  state.effects = { lineFlash: 0, shake: 0, spinParticles: [], spinConfig: { ...DEFAULT_SPIN_CONFIG } };
  state.das = { dir: null, delay: 0, repeat: 0, lastDir: null };
  state.config = { ...resolvedConfig };
  state.rules = { ...nextRules };
  state.seed = rngSeed;
  state.rng = createRng(rngSeed);
  state.mode = createModeState(mode.id);
  state.lastMoveWasRotation = false;
  state.lastRotationKick = null;
  state.lastRotationPosition = null;
  spawnNextPiece(state);
};
