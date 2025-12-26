import type { GameConfig, GameEndReason, GameModeId, GameModeState, GameRules, GameState } from './types';
import { DEFAULT_CONFIG, DEFAULT_RULES } from './types';

export type GameModeMetric = 'score' | 'time';
export type GameModeSort = 'asc' | 'desc';

export interface GameModeDefinition {
  id: GameModeId;
  label: string;
  description: string;
  rules: GameRules;
  config: Partial<GameConfig>;
  goalLines?: number;
  timeLimitMs?: number;
  startOnInput: boolean;
  metric?: GameModeMetric;
  sort?: GameModeSort;
  showScore: boolean;
  showLines: boolean;
  showTimer: boolean;
  showPieces: boolean;
}

const createRules = (overrides: Partial<GameRules>): GameRules => ({
  ...DEFAULT_RULES,
  ...overrides
});

export const GAME_MODES: GameModeDefinition[] = [
  {
    id: 'zen',
    label: 'Zen',
    description: 'Relaxed play with no score pressure.',
    rules: createRules({ scoreEnabled: false }),
    config: {},
    startOnInput: false,
    showScore: false,
    showLines: false,
    showTimer: true,
    showPieces: true
  },
  {
    id: 'sprint40',
    label: '40 Lines',
    description: 'Clear 40 lines as fast as possible.',
    rules: createRules({ scoreEnabled: false }),
    config: {},
    goalLines: 40,
    startOnInput: true,
    metric: 'time',
    sort: 'asc',
    showScore: false,
    showLines: true,
    showTimer: true,
    showPieces: false
  },
  {
    id: 'blitz',
    label: 'Blitz',
    description: 'Score as much as you can in 2 minutes.',
    rules: createRules({ scoreEnabled: true }),
    config: {},
    timeLimitMs: 120000,
    startOnInput: true,
    metric: 'score',
    sort: 'desc',
    showScore: true,
    showLines: true,
    showTimer: true,
    showPieces: false
  }
];

export const DEFAULT_MODE_ID: GameModeId = 'blitz';

export const getModeById = (id: GameModeId): GameModeDefinition =>
  GAME_MODES.find((mode) => mode.id === id) ?? GAME_MODES[0]!;

export const resolveModeConfig = (base: GameConfig, modeId: GameModeId): GameConfig => {
  const mode = getModeById(modeId);
  return {
    ...DEFAULT_CONFIG,
    ...base,
    ...mode.config
  };
};

export const createModeState = (modeId: GameModeId): GameModeState => {
  const mode = getModeById(modeId);
  return {
    id: mode.id,
    started: false,
    startOnInput: mode.startOnInput,
    elapsedMs: 0,
    timeLimitMs: mode.timeLimitMs ?? null,
    goalLines: mode.goalLines ?? null,
    pieces: 0,
    endReason: null
  };
};

export const endMode = (state: GameState, reason: GameEndReason): void => {
  if (state.mode.endReason) return;
  state.mode.endReason = reason;
  state.status = 'results';
  // Stop active screen shake when the run ends (e.g., Sprint 40 goal completion).
  state.effects.shake = 0;
};
