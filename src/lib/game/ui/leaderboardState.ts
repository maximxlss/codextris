import type { GameModeDefinition } from '../modes';
import type { LeaderboardEntry } from '../leaderboard';

export type LeaderboardStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error' | 'offline';

export type LeaderboardState = {
  status: LeaderboardStatus;
  entries: LeaderboardEntry[];
  error?: string;
  updatedAt?: number;
};

export const rankForMetric = (
  mode: GameModeDefinition,
  metricValue: number | null,
  entries: LeaderboardEntry[]
): number | null => {
  if (!mode.sort || metricValue === null) return null;
  if (entries.length === 0) return 1;
  const ascending = mode.sort === 'asc';
  const index = entries.findIndex((entry) =>
    ascending ? metricValue <= entry.metricValue : metricValue >= entry.metricValue
  );
  if (index === -1) return entries.length + 1;
  return index + 1;
};
