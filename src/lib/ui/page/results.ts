import { buildResult, toSubmitPayload, type GameResult } from '$lib/game/leaderboard';
import { submitScore } from '$lib/game/leaderboardApi';
import type { SessionInfo } from '$lib/leaderboard/types';
import type { GameModeDefinition } from '$lib/game/modes';
import type { GameState } from '$lib/game/types';
import type { SessionStatus } from '$lib/ui/page/session';
import { isLeaderboardEnabled } from '$lib/leaderboard/config';

type SubmitStatus = 'idle' | 'pending' | 'success' | 'error' | 'offline';

type ResultsDeps = {
  game: GameState;
  getModeById: (modeId: GameModeDefinition['id']) => GameModeDefinition;
  getDisplayName: () => string;
  getHasNickname: () => boolean;
  getSessionInfo: () => SessionInfo | null;
  getSessionStatus: () => SessionStatus;
  getSessionError: () => string | null;
  getSessionPromise: () => Promise<void> | null;
  setSessionInfo: (value: SessionInfo | null) => void;
  getLastSubmittedKey: () => string | null;
  setLastSubmittedKey: (value: string | null) => void;
  setSubmitStatus: (status: SubmitStatus) => void;
  setSubmitError: (error: string | null) => void;
  setLastResult: (result: GameResult | null) => void;
  getLastResult: () => GameResult | null;
  raiseBackendError: (title: string, message: string) => void;
  refreshLeaderboards: (mode: GameModeDefinition) => Promise<void>;
  clientVersion: string;
};

const resultKey = (result: GameResult) =>
  `${result.modeId}:${result.metric}:${result.metricValue}:${result.createdAt}`;

export const createResultsManager = (deps: ResultsDeps) => {
  const submitResult = async (result: GameResult, force = false) => {
    const mode = deps.getModeById(result.modeId);
    if (!mode.metric) return;
    if (!deps.getHasNickname()) {
      deps.setSubmitStatus('error');
      deps.setSubmitError('Set a nickname to submit scores.');
      return;
    }
    if (!isLeaderboardEnabled) {
      deps.setSubmitStatus('offline');
      deps.setSubmitError(null);
      return;
    }
    if (!deps.getSessionInfo() && deps.getSessionStatus() === 'pending' && deps.getSessionPromise()) {
      await deps.getSessionPromise();
    }
    const session = deps.getSessionInfo();
    if (!session) {
      deps.setSubmitStatus('error');
      deps.setSubmitError(
        deps.getSessionStatus() === 'blocked'
          ? deps.getSessionError() ?? 'Leaderboard session blocked.'
          : 'Session missing. Start a new run.'
      );
      return;
    }
    const key = resultKey(result);
    if (!force && deps.getLastSubmittedKey() === key) return;
    deps.setLastSubmittedKey(key);
    deps.setSubmitStatus('pending');
    deps.setSubmitError(null);
    const payload = toSubmitPayload(result, deps.getDisplayName(), deps.clientVersion, session.nonce);
    const { error } = await submitScore(payload);
    if (error) {
      deps.setSubmitStatus(error === 'offline' ? 'offline' : 'error');
      deps.setSubmitError(error);
      deps.setLastSubmittedKey(null);
      if (error !== 'offline') {
        deps.raiseBackendError('Score submission failed', error);
      }
      return;
    }
    deps.setSubmitStatus('success');
    deps.setSubmitError(null);
    deps.setSessionInfo(null);
    void deps.refreshLeaderboards(mode);
  };

  const finalizeResults = () => {
    const mode = deps.getModeById(deps.game.mode.id);
    const result = buildResult(deps.game, mode);
    deps.setLastResult(result);
    deps.setSubmitStatus('idle');
    deps.setSubmitError(null);
    deps.setLastSubmittedKey(null);
    if (result && deps.game.mode.endReason !== 'quit' && deps.game.mode.endReason !== 'topout') {
      void submitResult(result);
    }
  };

  return {
    submitResult,
    finalizeResults
  };
};
