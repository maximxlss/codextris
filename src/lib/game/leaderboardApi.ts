import type { GameModeDefinition } from './modes';
import type { LeaderboardEntry, LeaderboardScope, SubmitPayload } from './leaderboard';
import { isLeaderboardEnabled, leaderboardApiUrl } from '$lib/leaderboard/config';
import type {
  LeaderboardBatchRequest,
  LeaderboardBatchResponse,
  LeaderboardScoreRow,
  SessionInfo
} from '$lib/leaderboard/types';

type ApiErrorPayload = { error?: string };

type ApiResult<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

const requestJson = async <T>(path: string, options: RequestInit): Promise<ApiResult<T>> => {
  if (!isLeaderboardEnabled) {
    return { data: null, error: 'offline', status: 503 };
  }
  try {
    const response = await fetch(leaderboardApiUrl(path), options);
    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const payload = isJson
      ? ((await response.json().catch(() => null)) as T | ApiErrorPayload | null)
      : null;
    if (!response.ok) {
      const message =
        payload && typeof (payload as ApiErrorPayload).error === 'string'
          ? (payload as ApiErrorPayload).error!
          : 'Unable to reach leaderboards.';
      const error = response.status === 503 ? 'offline' : message;
      return { data: null, error, status: response.status };
    }
    if (!isJson || payload === null) {
      return { data: null, error: 'offline', status: response.status };
    }
    return { data: payload as T, error: null, status: response.status };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { data: null, error: 'aborted', status: 0 };
    }
    if (typeof error === 'object' && error && (error as { name?: string }).name === 'AbortError') {
      return { data: null, error: 'aborted', status: 0 };
    }
    return { data: null, error: 'offline', status: 0 };
  }
};

const mapRow = (row: LeaderboardScoreRow): LeaderboardEntry => ({
  id: row.id,
  modeId: row.mode,
  metricValue: row.metric_value,
  score: row.score,
  timeMs: row.time_ms,
  lines: row.lines,
  pieces: row.pieces,
  pps: row.pps,
  seed: row.seed,
  playerName: row.player_name,
  createdAt: row.created_at,
  clientVersion: row.client_version
});

export const fetchLeaderboard = async (options: {
  mode: GameModeDefinition;
  scope: LeaderboardScope;
  playerName?: string;
  limit?: number;
}): Promise<LeaderboardEntry[]> => {
  if (!isLeaderboardEnabled) {
    throw new Error('offline');
  }
  const { mode, scope, playerName, limit = 50 } = options;
  if (scope === 'mine' && !playerName) {
    return [];
  }
  const batchOptions: {
    modes: GameModeDefinition[];
    scope: LeaderboardScope;
    playerName?: string;
    limit?: number;
  } = { modes: [mode], scope, limit };
  if (playerName) {
    batchOptions.playerName = playerName;
  }
  const entries = await fetchLeaderboardBatch(batchOptions);
  return entries.filter((entry) => entry.modeId === mode.id);
};

export const fetchLeaderboardBatch = async (options: {
  modes: GameModeDefinition[];
  scope: LeaderboardScope;
  playerName?: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<LeaderboardEntry[]> => {
  const { scope } = options;
  const batchOptions: {
    modes: GameModeDefinition[];
    playerName?: string;
    limit?: number;
    signal?: AbortSignal;
  } = { modes: options.modes };
  if (options.playerName) {
    batchOptions.playerName = options.playerName;
  }
  if (options.limit !== undefined) {
    batchOptions.limit = options.limit;
  }
  if (options.signal) {
    batchOptions.signal = options.signal;
  }
  const result = await fetchLeaderboardsCombined(batchOptions);
  return scope === 'mine' ? result.mine : result.global;
};

export const fetchLeaderboardsCombined = async (options: {
  modes: GameModeDefinition[];
  playerName?: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<{ global: LeaderboardEntry[]; mine: LeaderboardEntry[] }> => {
  if (!isLeaderboardEnabled) {
    throw new Error('offline');
  }
  const { modes, playerName, limit = 50, signal } = options;
  const modeIds = modes.filter((mode) => mode.metric).map((mode) => mode.id);
  if (modeIds.length === 0) {
    return { global: [], mine: [] };
  }

  const scope = playerName ? 'both' : 'global';
  const requestInit: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modes: modeIds,
      scope,
      playerName,
      limit
    })
  };
  if (signal) {
    requestInit.signal = signal;
  }
  const { data, error } = await requestJson<LeaderboardBatchResponse>(
    '/api/leaderboard/batch',
    requestInit
  );

  if (error) {
    throw new Error(error);
  }

  if (!data) {
    return { global: [], mine: [] };
  }

  if ('global' in data) {
    return {
      global: (data.global ?? []).map(mapRow),
      mine: (data.mine ?? []).map(mapRow)
    };
  }

  return { global: (data.entries ?? []).map(mapRow), mine: [] };
};

export const startLeaderboardSession = async (
  playerName: string
): Promise<{ session: SessionInfo | null; error?: string }> => {
  if (!isLeaderboardEnabled) {
    return { session: null, error: 'offline' };
  }
  const trimmed = playerName.trim();
  if (!trimmed) {
    return { session: null, error: 'nickname-required' };
  }

  const { data, error } = await requestJson<SessionInfo>('/api/leaderboard/session/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName: trimmed })
  });

  if (error) {
    return { session: null, error };
  }

  if (!data?.nonce || !data?.expiresAt) {
    return { session: null, error: 'invalid-session' };
  }

  return { session: { nonce: data.nonce, expiresAt: data.expiresAt } };
};

export const submitScore = async (
  payload: SubmitPayload
): Promise<{ entry: LeaderboardEntry | null; error?: string }> => {
  if (!isLeaderboardEnabled) {
    return { entry: null, error: 'offline' };
  }

  const { data, error } = await requestJson<{ entry?: LeaderboardScoreRow }>(
    '/api/leaderboard/session/submit',
    {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      playerName: payload.playerName.trim()
    })
    }
  );

  if (error) {
    return { entry: null, error };
  }
  if (data?.entry) {
    return { entry: mapRow(data.entry) };
  }
  return { entry: null };
};

export const cancelLeaderboardSession = async (
  nonce: string
): Promise<{ ok: boolean; error?: string }> => {
  if (!isLeaderboardEnabled) {
    return { ok: false, error: 'offline' };
  }
  const trimmed = nonce.trim();
  if (!trimmed) {
    return { ok: false, error: 'bad-request' };
  }

  const { error } = await requestJson<{ ok: boolean }>('/api/leaderboard/session/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce: trimmed })
  });

  if (error) {
    return { ok: false, error };
  }
  return { ok: true };
};

export const cancelLeaderboardSessionBeacon = (nonce: string): boolean => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  if (!navigator.sendBeacon || !isLeaderboardEnabled) return false;
  const trimmed = nonce.trim();
  if (!trimmed) return false;
  const payload = JSON.stringify({ nonce: trimmed });
  return navigator.sendBeacon(leaderboardApiUrl('/api/leaderboard/session/cancel'), payload);
};
