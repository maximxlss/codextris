const normalizeBase = (value: string | undefined) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

import { env } from '$env/dynamic/public';

const publicEnv = (env ?? (import.meta.env as ImportMetaEnv)) as ImportMetaEnv & {
  PUBLIC_API_BASE_URL?: string;
  PUBLIC_LEADERBOARD_ENABLED?: string;
};

export const leaderboardApiBase = normalizeBase(publicEnv.PUBLIC_API_BASE_URL);

const isDev = Boolean((import.meta as ImportMeta).env?.DEV);

export const isLeaderboardEnabled =
  publicEnv.PUBLIC_LEADERBOARD_ENABLED !== 'false' &&
  !(isDev && !publicEnv.PUBLIC_API_BASE_URL);

export const leaderboardApiUrl = (path: string) => `${leaderboardApiBase}${path}`;
