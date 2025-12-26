import type { AudioManager } from '$lib/game/audio';
import type { InputController } from '$lib/game/input';
import type { GameModeDefinition } from '$lib/game/modes';
import type { ClearBanner } from '$lib/game/render/canvas';
import type { GameConfig, GameModeId, GameState, GameStatus } from '$lib/game/types';
import type { GameResult } from '$lib/game/leaderboard';

type SubmitStatus = 'idle' | 'pending' | 'success' | 'error' | 'offline';

type GameFlowDeps = {
  game: GameState;
  input: InputController;
  audio: AudioManager;
  getSelectedModeId: () => GameModeId;
  setSelectedModeId: (modeId: GameModeId) => void;
  getConfigDraft: () => GameConfig;
  resetGame: (state: GameState, config: GameConfig, options: { modeId: GameModeId; rules: GameModeDefinition['rules']; seed: number }) => void;
  getModeById: (modeId: GameModeId) => GameModeDefinition;
  persistMode: (modeId: GameModeId) => void;
  applyConfigToGame: (config: GameConfig) => void;
  resetSessionState: () => void;
  startRunSession: (mode: GameModeDefinition) => void;
  setLastResult: (result: GameResult | null) => void;
  setSubmitStatus: (status: SubmitStatus) => void;
  setSubmitError: (error: string | null) => void;
  setLastSubmittedKey: (value: string | null) => void;
  setClearBanner: (banner: ClearBanner | null) => void;
  getShowViewportGuard: () => boolean;
  getBypassViewportGuard: () => boolean;
  getAudioUnlocked: () => boolean;
  setAudioUnlocked: (value: boolean) => void;
  getRestartCooldownUntil: () => number;
  bumpRestartCooldown: (durationMs?: number) => void;
  cancelResumeCountdown: () => void;
  beginResumeCountdown: () => void;
  getResumeDeadline: () => number;
  setPausedForModal: (value: boolean) => void;
  isCompetitiveMode: (mode: GameModeDefinition) => boolean;
};

export const createGameFlow = (deps: GameFlowDeps) => {
  const resetRunState = () => {
    deps.setClearBanner(null);
    deps.input.reset();
    deps.setLastResult(null);
    deps.setSubmitStatus('idle');
    deps.setSubmitError(null);
    deps.setLastSubmittedKey(null);
  };

  const resetMenuState = (modeId: GameModeId) => {
    const mode = deps.getModeById(modeId);
    deps.resetGame(deps.game, deps.getConfigDraft(), {
      modeId: mode.id,
      rules: mode.rules,
      seed: Date.now()
    });
    deps.game.status = 'menu';
    resetRunState();
  };

  const startGame = () => {
    if (deps.getShowViewportGuard() && !deps.getBypassViewportGuard()) return;
    if (!deps.getAudioUnlocked()) {
      deps.audio.unlock();
      deps.setAudioUnlocked(true);
    }
    deps.cancelResumeCountdown();
    const mode = deps.getModeById(deps.getSelectedModeId());
    deps.setSelectedModeId(mode.id);
    deps.persistMode(mode.id);
    deps.resetGame(deps.game, deps.getConfigDraft(), {
      modeId: mode.id,
      rules: mode.rules,
      seed: Date.now()
    });
    resetRunState();
    deps.resetSessionState();
    deps.startRunSession(mode);
  };

  const restartGame = () => {
    if (deps.getShowViewportGuard() && !deps.getBypassViewportGuard()) return;
    if (Date.now() < deps.getRestartCooldownUntil()) return;
    deps.bumpRestartCooldown();
    deps.cancelResumeCountdown();
    const mode = deps.getModeById(deps.game.mode.id ?? deps.getSelectedModeId());
    deps.setSelectedModeId(mode.id);
    deps.persistMode(mode.id);
    deps.resetGame(deps.game, deps.getConfigDraft(), {
      modeId: mode.id,
      rules: mode.rules,
      seed: Date.now()
    });
    resetRunState();
    deps.resetSessionState();
    deps.startRunSession(mode);
  };

  const togglePause = () => {
    if (deps.game.status === 'playing') {
      deps.game.status = 'paused';
      deps.cancelResumeCountdown();
      return;
    }
    if (deps.game.status === 'paused') {
      if (deps.isCompetitiveMode(deps.getModeById(deps.game.mode.id))) {
        restartGame();
        return;
      }
      if (deps.getResumeDeadline()) {
        deps.cancelResumeCountdown();
      } else {
        deps.beginResumeCountdown();
      }
    }
  };

  const applyModeSwitch = (modeId: GameModeId) => {
    const mode = deps.getModeById(modeId);
    deps.setSelectedModeId(mode.id);
    deps.persistMode(mode.id);
    deps.applyConfigToGame(deps.getConfigDraft());
    deps.resetSessionState();
    deps.cancelResumeCountdown();
    deps.setPausedForModal(false);
    resetMenuState(mode.id);
  };

  const requestModeSwitch = (modeId: GameModeId) => {
    if (modeId === deps.getSelectedModeId()) return;
    applyModeSwitch(modeId);
  };

  const returnToMenu = () => {
    deps.cancelResumeCountdown();
    resetMenuState(deps.getSelectedModeId());
  };

  const canRestart = (status: GameStatus) =>
    (status === 'playing' || status === 'paused' || status === 'results') &&
    Date.now() >= deps.getRestartCooldownUntil();

  const primaryLabel = (status: GameStatus) => {
    switch (status) {
      case 'menu':
        return 'Start';
      case 'paused':
        if (deps.isCompetitiveMode(deps.getModeById(deps.game.mode.id))) return 'Restart';
        return deps.getResumeDeadline() > 0 ? 'Resuming' : 'Resume';
      case 'gameover':
        return 'New game';
      case 'results':
        return 'Play again';
      case 'playing':
      default:
        return 'Pause';
    }
  };

  const handlePrimaryAction = () => {
    switch (deps.game.status) {
      case 'menu':
        startGame();
        break;
      case 'paused':
        if (deps.isCompetitiveMode(deps.getModeById(deps.game.mode.id))) {
          restartGame();
        } else {
          togglePause();
        }
        break;
      case 'gameover':
      case 'results':
        restartGame();
        break;
      case 'playing':
      default:
        togglePause();
        break;
    }
  };

  return {
    startGame,
    restartGame,
    togglePause,
    applyModeSwitch,
    requestModeSwitch,
    returnToMenu,
    resetMenuState,
    canRestart,
    primaryLabel,
    handlePrimaryAction
  };
};
