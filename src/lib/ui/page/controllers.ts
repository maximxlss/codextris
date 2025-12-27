import type { GameModeDefinition } from '$lib/game/modes';
import type { GameModeId } from '$lib/game/types';
import type { LeaderboardScope } from '$lib/game/leaderboard';
import type { LeaderboardState } from '$lib/game/ui/leaderboardState';
import type { SessionInfo } from '$lib/leaderboard/types';
import { createLeaderboardController } from '$lib/ui/page/leaderboards';
import { createSessionManager, type SessionStatus } from '$lib/ui/page/session';

type SessionDeps = {
  getSessionEpoch: () => number;
  bumpSessionEpoch: () => number;
  getSessionInfo: () => SessionInfo | null;
  setSessionInfo: (info: SessionInfo | null) => void;
  setSessionError: (error: string | null) => void;
  setSessionStatus: (status: SessionStatus) => void;
  getSessionRequested: () => boolean;
  setSessionRequested: (value: boolean) => void;
  setSessionPromise: (promise: Promise<void> | null) => void;
  getHasNickname: () => boolean;
  getDisplayName: () => string;
  raiseBackendError: (title: string, message: string) => void;
};

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

export const createPageControllers = (deps: {
  session: SessionDeps;
  leaderboard: LeaderboardDeps;
}) => {
  const sessionManager = createSessionManager(deps.session);
  const leaderboardController = createLeaderboardController(deps.leaderboard);

  return {
    sessionManager,
    leaderboardController,
    resetSessionState: () => sessionManager.resetSessionState(),
    startRunSession: (mode: GameModeDefinition) => sessionManager.startRunSession(mode)
  };
};
