import { isLeaderboardEnabled } from '$lib/leaderboard/config';
import { cancelLeaderboardSession, startLeaderboardSession } from '$lib/game/leaderboardApi';
import type { GameModeDefinition } from '$lib/game/modes';
import type { SessionInfo } from '$lib/leaderboard/types';

export type SessionStatus =
  | 'idle'
  | 'pending'
  | 'ready'
  | 'blocked'
  | 'error'
  | 'offline';

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

export const createSessionManager = (deps: SessionDeps) => {
  let pendingCancel: Promise<void> | null = null;
  let activeRequest: Promise<void> | null = null;
  let queuedMode: GameModeDefinition | null = null;

  const queueCancel = (nonce: string) => {
    if (!nonce) return;
    const promise = cancelLeaderboardSession(nonce)
      .then(() => undefined)
      .catch(() => undefined);
    pendingCancel = promise;
    return promise;
  };

  const awaitPendingCancel = async () => {
    if (!pendingCancel) return;
    const promise = pendingCancel;
    await promise;
    if (pendingCancel === promise) {
      pendingCancel = null;
    }
  };

  const clearSession = () => {
    deps.setSessionInfo(null);
    deps.setSessionError(null);
    deps.setSessionStatus('idle');
  };

  const resetSessionState = () => {
    const current = deps.getSessionInfo();
    if (current?.nonce) {
      queueCancel(current.nonce);
    }
    deps.bumpSessionEpoch();
    clearSession();
    deps.setSessionRequested(false);
    deps.setSessionPromise(null);
  };

  const ensureSession = async (mode: GameModeDefinition, epoch = deps.getSessionEpoch()) => {
    if (!mode.metric) {
      clearSession();
      return;
    }
    if (!deps.getHasNickname()) {
      deps.setSessionStatus('blocked');
      deps.setSessionError('Set a nickname to submit scores.');
      deps.setSessionInfo(null);
      return;
    }
    if (!isLeaderboardEnabled) {
      deps.setSessionStatus('offline');
      deps.setSessionError(null);
      deps.setSessionInfo(null);
      return;
    }
    const current = deps.getSessionInfo();
    if (current && new Date(current.expiresAt).getTime() > Date.now()) {
      deps.setSessionStatus('ready');
      return;
    }
    if (current?.nonce) {
      queueCancel(current.nonce);
    }
    await awaitPendingCancel();
    deps.setSessionStatus('pending');
    deps.setSessionError(null);
    const { session, error } = await startLeaderboardSession(deps.getDisplayName());
    if (epoch !== deps.getSessionEpoch()) return;
    if (error || !session) {
      let status: SessionStatus = 'error';
      if (error === 'offline') {
        status = 'offline';
      } else if (error === 'nickname-required' || error === 'rate-limited') {
        status = 'blocked';
      }
      deps.setSessionStatus(status);
      const message = error ?? 'Unable to start session.';
      deps.setSessionError(message);
      if (message && error !== 'nickname-required' && error !== 'aborted') {
        deps.raiseBackendError('Leaderboard session failed', message);
      }
      deps.setSessionInfo(null);
      return;
    }
    deps.setSessionInfo(session);
    deps.setSessionStatus('ready');
    deps.setSessionError(null);
  };

  const startRunSession = (mode: GameModeDefinition) => {
    if (!mode.metric) return;
    if (activeRequest) {
      queuedMode = mode;
      return;
    }
    if (deps.getSessionRequested()) return;
    deps.setSessionRequested(true);
    const promise = ensureSession(mode, deps.getSessionEpoch()).finally(() => {
      activeRequest = null;
      if (queuedMode) {
        const nextMode = queuedMode;
        queuedMode = null;
        startRunSession(nextMode);
      }
    });
    activeRequest = promise;
    deps.setSessionPromise(promise);
  };

  return {
    clearSession,
    resetSessionState,
    startRunSession,
    ensureSession
  };
};
