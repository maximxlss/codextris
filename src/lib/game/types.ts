export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 22;
export const VISIBLE_HEIGHT = 20;
export const HIDDEN_ROWS = BOARD_HEIGHT - VISIBLE_HEIGHT;

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export type Rotation = 0 | 1 | 2 | 3;
export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover' | 'results';

export type GameModeId = 'zen' | 'sprint40' | 'blitz';
export type GameEndReason = 'topout' | 'goal' | 'time' | 'quit';

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export interface GameConfig {
  gravityMs: number;
  lockDelayMs: number;
  dasMs: number;
  arrMs: number;
  softDropFactor: number;
}

export interface GameRules {
  allowHold: boolean;
  allowHardDrop: boolean;
  allowRotate180: boolean;
  scoreEnabled: boolean;
  fullClearBonus: number;
  comboCurve: number;
  comboMaxMultiplier: number;
  backToBackMultiplier: number;
  linesPerLevel: number;
  lineScores: number[];
  tSpinScores: number[];
}

export type LockResultKind = 'none' | 'line' | 'tspin' | 'tspin-mini' | 'spin' | 'spin-mini';

export interface LockResult {
  kind: LockResultKind;
  lines: number;
  fullClear: boolean;
  spinType?: PieceType;
  combo?: number;
  backToBack?: boolean;
  score?: ScoreBreakdown;
}

export interface ScoreBreakdown {
  base: number;
  b2bMultiplier: number;
  comboMultiplier: number;
  fullClearBonus: number;
  total: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  gravityMs: 1000,
  lockDelayMs: 500,
  dasMs: 140,
  arrMs: 30,
  softDropFactor: 20
};

export const DEFAULT_RULES: GameRules = {
  allowHold: true,
  allowHardDrop: true,
  allowRotate180: true,
  scoreEnabled: true,
  fullClearBonus: 2000,
  comboCurve: 0.2,
  comboMaxMultiplier: 2.5,
  backToBackMultiplier: 1.5,
  linesPerLevel: 10,
  lineScores: [0, 100, 300, 500, 800],
  tSpinScores: [0, 800, 1200, 1600]
};

export interface GameModeState {
  id: GameModeId;
  started: boolean;
  startOnInput: boolean;
  elapsedMs: number;
  timeLimitMs: number | null;
  goalLines: number | null;
  pieces: number;
  endReason: GameEndReason | null;
}

export interface SpinParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  trail: { x: number; y: number; life: number; ttl: number }[];
  trailTimer: number;
  life: number;
  ttl: number;
}

export interface SpinParticleConfig {
  perEmitter: number;
  maxParticles: number;
  speed: number;
  life: number;
  size: number;
  drag: number;
  gravity: number;
  trailInterval: number;
  maxTrail: number;
  trailPointLife: number;
}

export interface RotationKick {
  x: number;
  y: number;
  index: number;
}

export interface EffectsState {
  lineFlash: number;
  shake: number;
  spinParticles: SpinParticle[];
  spinConfig: SpinParticleConfig;
}

export interface DasState {
  dir: 'left' | 'right' | null;
  delay: number;
  repeat: number;
  lastDir: 'left' | 'right' | null;
}

export interface RngState {
  seed: number;
}

export interface GameState {
  board: number[][];
  active: ActivePiece;
  queue: PieceType[];
  hold: PieceType | null;
  holdUsed: boolean;
  status: GameStatus;
  score: number;
  lines: number;
  level: number;
  combo: number;
  backToBack: boolean;
  b2bStreak: number;
  gravityTimer: number;
  lockTimer: number;
  effects: EffectsState;
  das: DasState;
  config: GameConfig;
  seed: number;
  rng: RngState;
  lastMoveWasRotation: boolean;
  lastRotationKick: RotationKick | null;
  lastRotationPosition: { x: number; y: number } | null;
  rules: GameRules;
  mode: GameModeState;
}

export type Action =
  | 'left'
  | 'right'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateCW'
  | 'rotateCCW'
  | 'rotate180'
  | 'hold'
  | 'pause'
  | 'restart';

export interface InputSnapshot {
  held: Record<Action, boolean>;
  pressed: Record<Action, boolean>;
}

export interface GameEvents {
  moved?: boolean;
  rotated?: boolean;
  locked?: boolean;
  hardDrop?: boolean;
  lockResult?: LockResult;
  spinPreview?: LockResult;
  hold?: boolean;
}
