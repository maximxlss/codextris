import type { GameConfig, GameModeId } from '$lib/game/types';
import { MAX_NICKNAME_LENGTH } from '$lib/leaderboard/constants';

type NormalizeConfig = (draft: GameConfig) => GameConfig;

const safeGet = (key: string): string | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures (private mode, quotas).
  }
};

export const loadStoredConfig = (
  key: string,
  current: GameConfig,
  normalize: NormalizeConfig
): GameConfig | null => {
  const raw = safeGet(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GameConfig>;
    return normalize({ ...current, ...parsed });
  } catch {
    return null;
  }
};

export const loadStoredMode = (
  key: string,
  validModes: ReadonlyArray<GameModeId>
): GameModeId | null => {
  const stored = safeGet(key);
  if (!stored) return null;
  return validModes.includes(stored as GameModeId) ? (stored as GameModeId) : null;
};

export const loadStoredNickname = (key: string): string | null => {
  const stored = safeGet(key);
  if (typeof stored !== 'string') return null;
  const trimmed = stored.trim();
  if (!trimmed) return null;
  return trimmed.length > MAX_NICKNAME_LENGTH ? trimmed.slice(0, MAX_NICKNAME_LENGTH) : trimmed;
};

export const loadStoredAudioMuted = (key: string): boolean | null => {
  const raw = safeGet(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { muted?: boolean } | boolean;
    if (typeof parsed === 'boolean') return parsed;
    if (typeof parsed?.muted === 'boolean') return parsed.muted;
  } catch {
    // Ignore malformed audio settings.
  }
  return null;
};

export const persistConfig = (key: string, nextConfig: GameConfig): void => {
  safeSet(key, JSON.stringify(nextConfig));
};

export const persistAudioMuted = (key: string, muted: boolean): void => {
  safeSet(key, JSON.stringify({ muted }));
};

export const persistMode = (key: string, modeId: GameModeId): void => {
  safeSet(key, modeId);
};

export const persistNickname = (key: string, value: string): void => {
  safeSet(key, value);
};
