import type { GameState, GameModeId } from './types';
import type { GameModeDefinition, GameModeMetric } from './modes';

export interface GameResult {
  modeId: GameModeDefinition['id'];
  metric: GameModeMetric;
  metricValue: number;
  score: number;
  timeMs: number;
  lines: number;
  pieces: number;
  pps: number;
  seed: number;
  createdAt: number;
}

export type LeaderboardScope = 'global' | 'mine';

export interface LeaderboardEntry {
  id: string;
  modeId: GameModeId;
  metricValue: number;
  score: number;
  timeMs: number;
  lines: number;
  pieces: number;
  pps: number;
  seed: number | null;
  playerName: string;
  createdAt: string;
  clientVersion: string | null;
}

export interface SubmitPayload extends GameResult {
  playerName: string;
  clientVersion: string;
  nonce?: string | null;
}

export const buildResult = (
  state: GameState,
  mode: GameModeDefinition,
  createdAt = Date.now()
): GameResult | null => {
  if (!mode.metric) return null;
  const timeMs = Math.max(0, Math.round(state.mode.elapsedMs));
  const score = state.score;
  const lines = state.lines;
  const pieces = state.mode.pieces;
  const pps = timeMs > 0 ? pieces / (timeMs / 1000) : 0;
  const metricValue = mode.metric === 'time' ? timeMs : score;
  return {
    modeId: mode.id,
    metric: mode.metric,
    metricValue,
    score,
    timeMs,
    lines,
    pieces,
    pps,
    seed: state.seed,
    createdAt
  };
};

export const toSubmitPayload = (
  result: GameResult,
  playerName: string,
  clientVersion: string,
  nonce?: string | null
): SubmitPayload => {
  const payload: SubmitPayload = {
    ...result,
    playerName,
    clientVersion
  };
  if (nonce !== undefined) {
    payload.nonce = nonce;
  }
  return payload;
};
