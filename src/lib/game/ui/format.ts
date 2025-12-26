import type { GameModeDefinition } from '../modes';

const pad2 = (value: number) => value.toString().padStart(2, '0');
const leaderboardDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric'
});
const leaderboardDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
});

const parseLeaderboardDate = (value: string): Date | null => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const formatClock = (ms: number, showMs = false): string => {
  const total = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  if (!showMs) {
    return `${minutes}:${pad2(seconds)}`;
  }
  const centis = Math.floor((total % 1000) / 10);
  return `${minutes}:${pad2(seconds)}.${pad2(centis)}`;
};

export const formatRate = (value: number): string => value.toFixed(2);

export const formatMetricValue = (
  value: number | null,
  mode: GameModeDefinition
): string => {
  if (value === null) return '—';
  if (mode.metric === 'time') return formatClock(value, true);
  return `${value}`;
};

export const formatRank = (rank: number | null, entriesLength: number): string => {
  if (!rank || entriesLength === 0) return '—';
  if (rank > entriesLength) return `>${entriesLength}`;
  return `#${rank}`;
};

export const formatLeaderboardDate = (value: string): string => {
  const date = parseLeaderboardDate(value);
  if (!date) return '—';
  return leaderboardDateFormatter.format(date);
};

export const formatLeaderboardDateTime = (value: string): string => {
  const date = parseLeaderboardDate(value);
  if (!date) return '—';
  return leaderboardDateTimeFormatter.format(date);
};
