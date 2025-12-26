import { fetchLeaderboardsCombined } from '$lib/game/leaderboardApi';
import type { GameModeDefinition } from '$lib/game/modes';
import type { GameModeId } from '$lib/game/types';
import type { LeaderboardEntry, LeaderboardScope } from '$lib/game/leaderboard';
import type { LeaderboardState, LeaderboardStatus } from '$lib/game/ui/leaderboardState';
import { isLeaderboardEnabled } from '$lib/leaderboard/config';

type LeaderboardDeps = {
  getModes: () => GameModeDefinition[];
  getHasNickname: () => boolean;
  getNicknameValue: () => string;
  getLeaderboardGlobal: () => LeaderboardState;
  getLeaderboardMine: () => LeaderboardState;
  setLeaderboardGlobal: (state: LeaderboardState) => void;
  setLeaderboardMine: (state: LeaderboardState) => void;
  getLeaderboardTab: () => LeaderboardScope;
  setLeaderboardTab: (tab: LeaderboardScope) => void;
  getLeaderboardOpen: () => boolean;
  getLastLeaderboardOpen: () => boolean;
  setLastLeaderboardOpen: (value: boolean) => void;
  getLeaderboardTimer: () => ReturnType<typeof setInterval> | null;
  setLeaderboardTimer: (timer: ReturnType<typeof setInterval> | null) => void;
  getLeaderboardModeId: () => GameModeId | null;
  setLeaderboardModeId: (id: GameModeId | null) => void;
  getLastNicknameRefresh: () => string;
  setLastNicknameRefresh: (value: string) => void;
  getRequestId: () => number;
  setRequestId: (value: number) => void;
  raiseBackendError: (title: string, message: string) => void;
  limit: number;
};

export const createLeaderboardController = (deps: LeaderboardDeps) => {
  type LeaderboardCache = {
    status: LeaderboardStatus;
    entriesByMode: Record<GameModeId, LeaderboardEntry[]>;
    error?: string;
    updatedAt?: number;
  };

  const createEntriesByMode = (modes: GameModeDefinition[]) => {
    const entriesByMode = {} as Record<GameModeId, LeaderboardEntry[]>;
    for (const mode of modes) {
      entriesByMode[mode.id] = [];
    }
    return entriesByMode;
  };

  const createCache = (): LeaderboardCache => ({
    status: 'idle',
    entriesByMode: createEntriesByMode(deps.getModes())
  });

  const buildEntriesByMode = (
    entries: LeaderboardEntry[],
    modes: GameModeDefinition[],
    limit: number
  ) => {
    const entriesByMode = createEntriesByMode(modes);
    for (const entry of entries) {
      if (entriesByMode[entry.modeId]) {
        entriesByMode[entry.modeId].push(entry);
      }
    }
    for (const mode of modes) {
      if (!mode.metric || !mode.sort) {
        entriesByMode[mode.id] = [];
        continue;
      }
      const ascending = mode.sort === 'asc';
      const sorted = entriesByMode[mode.id].sort((a, b) => {
        if (a.metricValue !== b.metricValue) {
          return ascending ? a.metricValue - b.metricValue : b.metricValue - a.metricValue;
        }
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return aTime - bTime;
      });
      entriesByMode[mode.id] = limit > 0 ? sorted.slice(0, limit) : sorted;
    }
    return entriesByMode;
  };

  const setLeaderboardState = (scope: LeaderboardScope, next: LeaderboardState): void => {
    if (scope === 'global') {
      deps.setLeaderboardGlobal(next);
    } else {
      deps.setLeaderboardMine(next);
    }
  };

  const applyCacheToState = (
    scope: LeaderboardScope,
    mode: GameModeDefinition,
    cache: LeaderboardCache,
    previous: LeaderboardState
  ): void => {
    if (!mode.metric) {
      setLeaderboardState(scope, { status: 'empty', entries: [] });
      return;
    }
    if (scope === 'mine' && !deps.getHasNickname()) {
      setLeaderboardState(scope, { status: 'empty', entries: [] });
      return;
    }
    if (cache.status === 'loading' || cache.status === 'idle') {
      setLeaderboardState(scope, { status: 'loading', entries: previous.entries });
      return;
    }
    if (cache.status === 'offline') {
      setLeaderboardState(scope, { status: 'offline', entries: previous.entries });
      return;
    }
    if (cache.status === 'error') {
      const nextState: LeaderboardState = {
        status: 'error',
        entries: previous.entries
      };
      if (cache.error) {
        nextState.error = cache.error;
      }
      setLeaderboardState(scope, nextState);
      return;
    }
    const entries = cache.entriesByMode[mode.id] ?? [];
    const nextState: LeaderboardState = {
      status: entries.length > 0 ? 'ready' : 'empty',
      entries
    };
    if (cache.updatedAt) {
      nextState.updatedAt = cache.updatedAt;
    }
    setLeaderboardState(scope, nextState);
  };

  let globalCache = createCache();
  let mineCache = createCache();
  let refreshInFlight: Promise<void> | null = null;
  let queuedMode: GameModeDefinition | null = null;
  let activeAbort: AbortController | null = null;

  const resetCache = (scope: LeaderboardScope) => {
    if (scope === 'global') {
      globalCache = createCache();
    } else {
      mineCache = createCache();
    }
  };

  const getCache = (scope: LeaderboardScope) => (scope === 'global' ? globalCache : mineCache);

  const runRefresh = async (mode: GameModeDefinition): Promise<void> => {
    const requestId = deps.getRequestId() + 1;
    deps.setRequestId(requestId);
    const globalPrevious = deps.getLeaderboardGlobal();
    const minePrevious = deps.getLeaderboardMine();

    if (!mode.metric) {
      setLeaderboardState('global', { status: 'empty', entries: [] });
      setLeaderboardState('mine', { status: 'empty', entries: [] });
      return;
    }
    if (!isLeaderboardEnabled) {
      setLeaderboardState('global', { status: 'offline', entries: globalPrevious.entries });
      setLeaderboardState('mine', { status: 'offline', entries: minePrevious.entries });
      return;
    }

    const hasNickname = deps.getHasNickname();
    const globalCache = getCache('global');
    globalCache.status = 'loading';
    delete globalCache.error;
    applyCacheToState('global', mode, globalCache, globalPrevious);

    if (hasNickname) {
      const mineCache = getCache('mine');
      mineCache.status = 'loading';
      delete mineCache.error;
      applyCacheToState('mine', mode, mineCache, minePrevious);
    } else {
      setLeaderboardState('mine', { status: 'empty', entries: [] });
      resetCache('mine');
    }

    if (activeAbort) {
      activeAbort.abort();
    }
    const abortController = new AbortController();
    activeAbort = abortController;

    try {
      const requestOptions: {
        modes: GameModeDefinition[];
        playerName?: string;
        limit?: number;
        signal?: AbortSignal;
      } = { modes: deps.getModes(), limit: deps.limit, signal: abortController.signal };
      if (hasNickname) {
        requestOptions.playerName = deps.getNicknameValue();
      }
      const { global, mine } = await fetchLeaderboardsCombined(requestOptions);
      if (requestId !== deps.getRequestId()) return;

      globalCache.status = 'ready';
      delete globalCache.error;
      globalCache.updatedAt = Date.now();
      globalCache.entriesByMode = buildEntriesByMode(global, deps.getModes(), deps.limit);
      applyCacheToState('global', mode, globalCache, globalPrevious);

      if (hasNickname) {
        const mineCache = getCache('mine');
        mineCache.status = 'ready';
        delete mineCache.error;
        mineCache.updatedAt = Date.now();
        mineCache.entriesByMode = buildEntriesByMode(mine, deps.getModes(), deps.limit);
        applyCacheToState('mine', mode, mineCache, minePrevious);
      }
    } catch (error) {
      if (requestId !== deps.getRequestId()) return;
      if (error instanceof Error && error.message === 'aborted') {
        return;
      }
      const message = error instanceof Error ? error.message : 'Unable to reach leaderboards.';
      const status: LeaderboardStatus = message === 'offline' ? 'offline' : 'error';
      globalCache.status = status;
      if (status === 'error') {
        globalCache.error = message;
      } else {
        delete globalCache.error;
      }
      applyCacheToState('global', mode, globalCache, globalPrevious);

      if (hasNickname) {
        const mineCache = getCache('mine');
        mineCache.status = status;
        if (status === 'error') {
          mineCache.error = message;
        } else {
          delete mineCache.error;
        }
        applyCacheToState('mine', mode, mineCache, minePrevious);
      }

      if (status === 'error') {
        deps.raiseBackendError('Leaderboard fetch failed', message);
      }
    } finally {
      if (activeAbort === abortController) {
        activeAbort = null;
      }
    }
  };

  const refreshLeaderboards = async (mode: GameModeDefinition): Promise<void> => {
    if (refreshInFlight) {
      queuedMode = mode;
      return refreshInFlight;
    }
    refreshInFlight = runRefresh(mode).finally(() => {
      refreshInFlight = null;
      if (queuedMode) {
        const nextMode = queuedMode;
        queuedMode = null;
        void refreshLeaderboards(nextMode);
      }
    });
    return refreshInFlight;
  };

  const clearLeaderboardTimer = () => {
    const current = deps.getLeaderboardTimer();
    if (!current) return;
    clearInterval(current);
    deps.setLeaderboardTimer(null);
  };

  const scheduleLeaderboardPolling = (mode: GameModeDefinition) => {
    clearLeaderboardTimer();
    if (!mode.metric || !isLeaderboardEnabled) return;
    const interval = deps.getLeaderboardOpen() ? 10000 : 60000;
    const timer = setInterval(() => {
      refreshLeaderboards(mode);
    }, interval);
    deps.setLeaderboardTimer(timer);
  };

  const handleModeChange = (mode: GameModeDefinition) => {
    deps.setLeaderboardModeId(mode.id);
    if (!mode.metric) {
      deps.setLeaderboardGlobal({ status: 'empty', entries: [] });
      deps.setLeaderboardMine({ status: 'empty', entries: [] });
    } else {
      const globalPrevious: LeaderboardState = {
        status: 'loading',
        entries: globalCache.entriesByMode[mode.id] ?? []
      };
      const minePrevious: LeaderboardState = {
        status: 'loading',
        entries: mineCache.entriesByMode[mode.id] ?? []
      };
      applyCacheToState('global', mode, globalCache, globalPrevious);
      applyCacheToState('mine', mode, mineCache, minePrevious);
    }
    const needsGlobal = globalCache.status !== 'ready';
    const needsMine = deps.getHasNickname() && mineCache.status !== 'ready';
    if (needsGlobal || needsMine) {
      void refreshLeaderboards(mode);
    }
    scheduleLeaderboardPolling(mode);
  };

  const handleOpenChange = (mode: GameModeDefinition) => {
    deps.setLastLeaderboardOpen(deps.getLeaderboardOpen());
    scheduleLeaderboardPolling(mode);
  };

  const handleNicknameChange = (mode: GameModeDefinition) => {
    deps.setLastNicknameRefresh(deps.getNicknameValue());
    resetCache('mine');
    if (!deps.getHasNickname()) {
      deps.setLeaderboardMine({ status: 'empty', entries: [] });
      return;
    }
    if (mode.metric) {
      void refreshLeaderboards(mode);
    }
  };

  return {
    refreshLeaderboards,
    scheduleLeaderboardPolling,
    clearLeaderboardTimer,
    handleModeChange,
    handleOpenChange,
    handleNicknameChange
  };
};
