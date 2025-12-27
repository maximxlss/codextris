import type { GameModeId } from '$lib/game/types';
import type { LeaderboardScope } from '$lib/game/leaderboard';

export type LeaderboardBatchScope = LeaderboardScope | 'both';

export type LeaderboardScoreRow = {
  id: string;
  mode: GameModeId;
  metric_value: number;
  score: number;
  time_ms: number;
  lines: number;
  pieces: number;
  pps: number;
  seed: number | null;
  player_name: string;
  created_at: string;
  client_version: string | null;
};

export type LeaderboardBatchRequest = {
  modes: GameModeId[];
  scope?: LeaderboardBatchScope;
  playerName?: string;
  limit?: number;
};

export type LeaderboardBatchResponse =
  | { entries: LeaderboardScoreRow[] }
  | { global: LeaderboardScoreRow[]; mine: LeaderboardScoreRow[] };

export type SessionInfo = {
  nonce: string;
  expiresAt: string;
};
