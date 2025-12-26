import { tick } from 'svelte';
import { defaultKeyMap, type InputController } from '$lib/game/input';
import { isEditableTarget } from '$lib/game/ui/modals';
import type { AudioManager } from '$lib/game/audio';
import type { GameModeDefinition } from '$lib/game/modes';
import type { GameConfig, GameModeId, GameStatus } from '$lib/game/types';
import type { SessionInfo } from '$lib/game/leaderboardApi';
import type { HandlingPresetId } from '$lib/ui/handlingPresets';

type LayoutManager = {
  setupCanvas: () => void;
  updateLayout: () => void;
  updateViewportFlags: () => void;
};

type LeaderboardController = {
  refreshLeaderboards: (mode: GameModeDefinition) => Promise<void>;
  scheduleLeaderboardPolling: (mode: GameModeDefinition) => void;
  clearLeaderboardTimer: () => void;
};

type PageLifecycleDeps = {
  storage: {
    configKey: string;
    modeKey: string;
    nicknameKey: string;
    audioKey: string;
    loadStoredConfig: (
      key: string,
      fallback: GameConfig,
      normalize: (draft: GameConfig) => GameConfig
    ) => GameConfig | null;
    loadStoredMode: (key: string, validIds: GameModeId[]) => GameModeId | null;
    loadStoredNickname: (key: string) => string | null;
    loadStoredAudioMuted: (key: string) => boolean | null;
  };
  state: {
    getConfigDraft: () => GameConfig;
    setConfigDraft: (config: GameConfig) => void;
    applyConfigToGame: (config: GameConfig) => void;
    setSelectedPreset: (presetId: HandlingPresetId) => void;
    detectPreset: (config: GameConfig) => HandlingPresetId;
    normalizeConfig: (config: GameConfig) => GameConfig;
    setNickname: (value: string) => void;
    setNicknameDraft: (value: string) => void;
    getAudioMuted: () => boolean;
    setAudioMutedState: (value: boolean) => void;
  };
  mode: {
    selectMode: (modeId: GameModeId) => void;
    getSelectedModeId: () => GameModeId;
    getModeById: (modeId: GameModeId) => GameModeDefinition;
    validModeIds: GameModeId[];
  };
  layout: LayoutManager;
  leaderboard: {
    getController: () => LeaderboardController | null;
  };
  session: {
    getSessionInfo: () => SessionInfo | null;
    cancelSessionBeacon: (nonce: string) => boolean;
  };
  input: {
    controller: InputController;
    getShowViewportGuard: () => boolean;
    getBypassViewportGuard: () => boolean;
    isAnyModalOpen: () => boolean;
    getGameStatus: () => GameStatus;
    pauseGame: () => void;
    startGame: () => void;
    restartGame: () => void;
  };
  audio: {
    controller: AudioManager;
    getAudioUnlocked: () => boolean;
    setAudioUnlocked: (value: boolean) => void;
  };
  frame: {
    setAccumulator: (value: number) => void;
    handleFrameInput: (snapshot: ReturnType<InputController['consume']>, now: number) => void;
    stepSimulation: (
      snapshot: ReturnType<InputController['consume']>,
      delta: number,
      now: number
    ) => void;
    finalizeFrame: (now: number) => void;
    maxFrameDelta: number;
  };
  focusTrap: {
    cleanup: () => void;
  };
};

export const createPageLifecycle = (deps: PageLifecycleDeps) => {
  const init = () => {
    let active = true;
    const storedConfig = deps.storage.loadStoredConfig(
      deps.storage.configKey,
      deps.state.getConfigDraft(),
      deps.state.normalizeConfig
    );

    if (storedConfig) {
      deps.state.setConfigDraft(storedConfig);
      deps.state.applyConfigToGame(storedConfig);
    }

    const storedMode = deps.storage.loadStoredMode(
      deps.storage.modeKey,
      deps.mode.validModeIds
    );
    if (storedMode) {
      deps.mode.selectMode(storedMode);
    }

    const storedNickname = deps.storage.loadStoredNickname(deps.storage.nicknameKey);
    if (storedNickname !== null) {
      deps.state.setNickname(storedNickname);
      deps.state.setNicknameDraft(storedNickname);
    }

    const storedAudio = deps.storage.loadStoredAudioMuted(deps.storage.audioKey);
    if (storedAudio !== null) {
      deps.state.setAudioMutedState(storedAudio);
    }

    deps.state.setSelectedPreset(deps.state.detectPreset(deps.state.getConfigDraft()));
    deps.audio.controller.setMuted(deps.state.getAudioMuted());

    deps.layout.setupCanvas();
    deps.layout.updateLayout();
    deps.layout.updateViewportFlags();

    tick().then(() => {
      if (!active) return;
      const controller = deps.leaderboard.getController();
      if (!controller) return;
      const mode = deps.mode.getModeById(deps.mode.getSelectedModeId());
      controller.scheduleLeaderboardPolling(mode);
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (deps.input.getShowViewportGuard() && !deps.input.getBypassViewportGuard()) return;
      if (deps.input.isAnyModalOpen() || isEditableTarget(event.target)) return;

      if (event.code === 'Enter') {
        if (event.repeat) return;
        const status = deps.input.getGameStatus();
        if (status === 'menu') {
          event.preventDefault();
          deps.input.startGame();
          return;
        }
        if (status === 'results') {
          event.preventDefault();
          deps.input.restartGame();
          return;
        }
      }

      const action = defaultKeyMap[event.code];
      if (!action) return;
      event.preventDefault();
      if (!deps.audio.getAudioUnlocked()) {
        deps.audio.controller.unlock();
        deps.audio.setAudioUnlocked(true);
      }
      deps.input.controller.handleKeyDown(action, event.repeat);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (deps.input.isAnyModalOpen() || isEditableTarget(event.target)) return;
      const action = defaultKeyMap[event.code];
      if (!action) return;
      event.preventDefault();
      deps.input.controller.handleKeyUp(action);
    };

    const handleViewportChange = () => {
      deps.layout.updateLayout();
      deps.layout.updateViewportFlags();
    };

    const resetInputState = () => {
      deps.input.controller.reset();
    };

    const sendCancelBeacon = () => {
      const session = deps.session.getSessionInfo();
      if (session?.nonce) {
        deps.session.cancelSessionBeacon(session.nonce);
      }
    };

    const handleVisibilityChange = () => {
      if (!active) return;
      if (document.visibilityState === 'hidden') {
        if (deps.input.getGameStatus() === 'playing') {
          deps.input.pauseGame();
        }
        resetInputState();
        stopFrameLoop();
        deps.leaderboard.getController()?.clearLeaderboardTimer();
        sendCancelBeacon();
        return;
      }
      resetInputState();
      startFrameLoop();
      const controller = deps.leaderboard.getController();
      if (controller) {
        const mode = deps.mode.getModeById(deps.mode.getSelectedModeId());
        controller.scheduleLeaderboardPolling(mode);
      }
    };

    const handleBlur = () => {
      if (deps.input.getGameStatus() === 'playing') {
        deps.input.pauseGame();
      }
      resetInputState();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let lastFrameAt = performance.now();
    deps.frame.setAccumulator(0);

    let rafId: number | null = null;
    let running = false;
    const frame = (now: number) => {
      if (!running) return;
      const delta = Math.min(deps.frame.maxFrameDelta, now - lastFrameAt);
      lastFrameAt = now;
      const snapshot = deps.input.controller.consume();

      deps.frame.handleFrameInput(snapshot, now);
      deps.frame.stepSimulation(snapshot, delta, now);
      deps.frame.finalizeFrame(now);

      if (running) {
        rafId = requestAnimationFrame(frame);
      }
    };

    const startFrameLoop = () => {
      if (running) return;
      running = true;
      lastFrameAt = performance.now();
      rafId = requestAnimationFrame(frame);
    };

    const stopFrameLoop = () => {
      if (!running) return;
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    startFrameLoop();

    return () => {
      active = false;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      deps.focusTrap.cleanup();
      const controller = deps.leaderboard.getController();
      if (controller) {
        controller.clearLeaderboardTimer();
      }
      stopFrameLoop();
    };
  };

  return { init };
};
