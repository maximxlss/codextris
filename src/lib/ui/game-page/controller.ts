import { browser } from '$app/environment';
import { derived, type Readable, writable } from 'svelte/store';
import { AudioManager } from '$lib/game/audio';
import { InputController } from '$lib/game/input';
import { createRenderOptions, renderGame, type ClearBanner } from '$lib/game/render/canvas';
import { createScoringLegend } from '$lib/game/scoring';
import { createGameState, resetGame, updateGame } from '$lib/game/tetris';
import {
  DEFAULT_MODE_ID,
  GAME_MODES,
  getModeById,
  type GameModeDefinition
} from '$lib/game/modes';
import type { GameResult, LeaderboardScope } from '$lib/game/leaderboard';
import { cancelLeaderboardSessionBeacon } from '$lib/game/leaderboardApi';
import type { SessionInfo } from '$lib/leaderboard/types';
import { rankForMetric, type LeaderboardState } from '$lib/game/ui/leaderboardState';
import { formatRank } from '$lib/game/ui/format';
import { startResumeCountdown } from '$lib/game/ui/resume';
import {
  loadStoredAudioMuted,
  loadStoredConfig,
  loadStoredMode,
  loadStoredNickname,
  persistAudioMuted,
  persistConfig,
  persistMode,
  persistNickname
} from '$lib/ui/storage';
import { buildClearBanner } from '$lib/ui/page/clearBanner';
import { detectPreset, normalizeConfig } from '$lib/ui/page/handling';
import { createConfigManager } from '$lib/ui/page/configManager';
import { createUiState } from '$lib/ui/page/uiState';
import { createGameFlow } from '$lib/ui/page/gameFlow';
import { createFrameLoop } from '$lib/ui/page/frameLoop';
import { createResultsManager } from '$lib/ui/page/results';
import { createFocusTrap } from '$lib/ui/page/focusTrap';
import { createLayoutManager } from '$lib/ui/page/layout';
import { createModalManager } from '$lib/ui/page/modals';
import { createPageControllers } from '$lib/ui/page/controllers';
import { createPageLifecycle } from '$lib/ui/page/lifecycle';
import {
  CLIENT_VERSION,
  FIXED_DT,
  LEADERBOARD_LIMIT,
  MAX_FRAME_DELTA,
  MIN_CELL_SIZE,
  MIN_VIEWPORT_ASPECT,
  MIN_VIEWPORT_HEIGHT,
  MIN_VIEWPORT_WIDTH,
  RESUME_COUNTDOWN_MS,
  STORAGE_KEY_AUDIO,
  STORAGE_KEY_CONFIG,
  STORAGE_KEY_MODE,
  STORAGE_KEY_NICKNAME
} from '$lib/ui/page/constants';
import {
  DEFAULT_CONFIG,
  DEFAULT_RULES,
  type GameConfig,
  type GameModeId,
  type GameState,
  type GameStatus,
  type LockResult
} from '$lib/game/types';
import { CUSTOM_PRESET, HANDLING_PRESETS, type HandlingPresetId } from '$lib/ui/handlingPresets';
import { deriveGamePage } from './derive';
import type { GamePageState, SubmitStatus } from './state';
import { createInitialState } from './controllerState';
import { buildActions, buildElements, buildView, type DomRefs } from './controllerBuilders';

export type GamePageActions = {
  startGame: () => void;
  restartGame: () => void;
  togglePause: () => void;
  returnToMenu: () => void;
  requestModeSwitch: (modeId: GameModeId) => void;
  saveNickname: () => void;
  retrySubmit: () => void;
  handlePrimaryAction: () => void;
  openControlsModal: () => void;
  openSettingsModal: () => void;
  openLeaderboardModal: (scope: LeaderboardScope) => void;
  closeModals: () => void;
  closeLeaderboardModal: () => void;
  toggleAudioMuted: () => void;
  onBypassViewportGuard: () => void;
  setLeaderboardTab: (scope: LeaderboardScope) => void;
  setNicknameDraft: (value: string) => void;
  dismissBackendAlert: (id: number) => void;
};

export type GamePageElements = {
  setCanvas: (el: HTMLCanvasElement | null) => void;
  setLayout: (el: HTMLElement | null) => void;
  setStage: (el: HTMLDivElement | null) => void;
  setControlsCard: (el: HTMLDivElement | null) => void;
  setSettingsCard: (el: HTMLDivElement | null) => void;
  setLeaderboardCard: (el: HTMLDivElement | null) => void;
};

export type GamePageView = {
  state: Readable<GamePageState>;
  derived: Readable<ReturnType<typeof deriveGamePage>>;
  modes: GameModeDefinition[];
  presets: typeof HANDLING_PRESETS;
  scoringLegend: Record<string, string>;
  config: {
    presetName: (presetId: HandlingPresetId) => string;
    applyPreset: (presetId: HandlingPresetId) => void;
    handleNumberInput: (key: keyof GameConfig) => (event: Event) => void;
  };
  helpers: {
    isCompetitiveMode: (mode: GameModeDefinition) => boolean;
    canRestart: (status: GameStatus) => boolean;
    primaryLabel: (status: GameStatus) => string;
  };
  format: {
    formatClock: typeof formatClock;
    formatRate: typeof formatRate;
    formatMetricValue: typeof formatMetricValue;
    formatRank: typeof formatRank;
    formatLeaderboardDate: typeof formatLeaderboardDate;
    formatLeaderboardDateTime: typeof formatLeaderboardDateTime;
  };
  labels: {
    endReasonLabel: typeof endReasonLabel;
    statusLabel: typeof statusLabel;
    modeTagline: typeof modeTagline;
  };
  constants: {
    customPresetId: HandlingPresetId;
  };
};

export type GamePageController = {
  view: GamePageView;
  actions: GamePageActions;
  elements: GamePageElements;
  init: () => () => void;
};

type ControllerOptions = {
  now?: () => number;
};

type RuntimeRefs = {
  dom: DomRefs;
  render: {
    ctx: CanvasRenderingContext2D | null;
    options: ReturnType<typeof createRenderOptions>;
  };
  frame: {
    accumulator: number;
    resumeDeadline: number;
    clearBanner: ClearBanner | null;
  };
  leaderboard: {
    timer: ReturnType<typeof setInterval> | null;
    lastOpen: boolean;
    modeId: GameModeId | null;
    lastNickname: string;
    requestId: number;
  };
  session: {
    lastNonce: string;
    requested: boolean;
    promise: Promise<void> | null;
    epoch: number;
  };
  flags: {
    audioUnlocked: boolean;
    pausedForModal: boolean;
  };
};

const createRuntimeRefs = (): RuntimeRefs => ({
  dom: {
    canvasEl: null,
    layoutEl: null,
    stageEl: null,
    controlsCardEl: null,
    settingsCardEl: null,
    leaderboardCardEl: null
  },
  render: {
    ctx: null,
    options: createRenderOptions(28)
  },
  frame: {
    accumulator: 0,
    resumeDeadline: 0,
    clearBanner: null
  },
  leaderboard: {
    timer: null,
    lastOpen: false,
    modeId: null,
    lastNickname: '',
    requestId: 0
  },
  session: {
    lastNonce: '',
    requested: false,
    promise: null,
    epoch: 0
  },
  flags: {
    audioUnlocked: false,
    pausedForModal: false
  }
});


export const createGamePageController = (options: ControllerOptions = {}): GamePageController => {
  const now = options.now ?? (() => Date.now());
  const refs = createRuntimeRefs();

  const input = new InputController();
  const audio = new AudioManager();

  const selectedModeId = DEFAULT_MODE_ID;
  const selectedMode = getModeById(selectedModeId);
  const configDraft: GameConfig = { ...DEFAULT_CONFIG };
  const game = createGameState(configDraft, undefined, selectedMode.rules, selectedMode.id);
  const ui = createUiState(game);

  let stateRef = createInitialState(game, ui, configDraft, selectedModeId);
  const stateStore = writable(stateRef);

  const setState = (patch: Partial<GamePageState>) => {
    stateRef = { ...stateRef, ...patch };
    stateStore.set(stateRef);
  };

  const derivedStore = derived(stateStore, ($state) =>
    deriveGamePage($state, { getModeById, rankForMetric, formatRank })
  );

  const SCORING_LEGEND = createScoringLegend(DEFAULT_RULES);

  const isCompetitiveMode = (mode: GameModeDefinition) => Boolean(mode.metric);

  const updateUi = () => {
    setState({ ui: createUiState(game) });
  };

  const beginResumeCountdown = () => {
    const started = startResumeCountdown(RESUME_COUNTDOWN_MS, performance.now());
    refs.frame.resumeDeadline = started.deadline;
    setState({ resumeCountdown: started.seconds });
    input.reset();
  };

  const cancelResumeCountdown = () => {
    refs.frame.resumeDeadline = 0;
    setState({ resumeCountdown: 0 });
  };

  const bumpRestartCooldown = (durationMs = 1000) => {
    const next = Math.max(stateRef.restartCooldownUntil, now() + durationMs);
    setState({ restartCooldownUntil: next });
  };

  const handleSessionNonce = (session: SessionInfo | null) => {
    if (!session?.nonce) {
      refs.session.lastNonce = '';
      if (now() >= stateRef.restartCooldownUntil) {
        setState({ restartCooldownUntil: 0 });
      }
      return;
    }
    if (session.nonce !== refs.session.lastNonce) {
      refs.session.lastNonce = session.nonce;
      bumpRestartCooldown(1000);
    }
  };

  const getDerived = () => deriveGamePage(stateRef, { getModeById, rankForMetric, formatRank });

  const modalManager = createModalManager({
    game,
    input,
    getShowControls: () => stateRef.showControls,
    setShowControls: (value) => setState({ showControls: value }),
    getShowSettings: () => stateRef.showSettings,
    setShowSettings: (value) => setState({ showSettings: value }),
    getLeaderboardOpen: () => stateRef.leaderboardOpen,
    setLeaderboardOpen: (value) => setState({ leaderboardOpen: value }),
    getBackendAlerts: () => stateRef.backendAlerts,
    setBackendAlerts: (value) => setState({ backendAlerts: value }),
    getPausedForModal: () => refs.flags.pausedForModal,
    setPausedForModal: (value) => {
      refs.flags.pausedForModal = value;
    },
    getDisplayMode: () => getDerived().displayMode,
    getHasNickname: () => getDerived().hasNickname,
    setLeaderboardTab: (scope) => setState({ leaderboardTab: scope }),
    getLeaderboardController: () => leaderboardController ?? null,
    cancelResumeCountdown,
    beginResumeCountdown,
    isCompetitiveMode,
    getModeById
  });

  const {
    isAnyModalOpen,
    raiseBackendError,
    dismissBackendAlert,
    openControlsModal,
    openSettingsModal,
    closeModals,
    openLeaderboardModal,
    closeLeaderboardModal
  } = modalManager;

  const { leaderboardController, resetSessionState, startRunSession } = createPageControllers({
    session: {
      getSessionEpoch: () => refs.session.epoch,
      bumpSessionEpoch: () => (refs.session.epoch += 1),
      getSessionInfo: () => stateRef.sessionInfo,
      setSessionInfo: (info) => {
        setState({ sessionInfo: info });
        handleSessionNonce(info);
      },
      setSessionError: (error) => setState({ sessionError: error }),
      setSessionStatus: (status) => setState({ sessionStatus: status }),
      getSessionRequested: () => refs.session.requested,
      setSessionRequested: (value) => {
        refs.session.requested = value;
      },
      setSessionPromise: (promise) => {
        refs.session.promise = promise;
      },
      getHasNickname: () => getDerived().hasNickname,
      getDisplayName: () => getDerived().displayName,
      raiseBackendError
    },
    leaderboard: {
      getModes: () => GAME_MODES,
      getHasNickname: () => getDerived().hasNickname,
      getNicknameValue: () => getDerived().nicknameValue,
      getLeaderboardGlobal: () => stateRef.leaderboardGlobal,
      getLeaderboardMine: () => stateRef.leaderboardMine,
      setLeaderboardGlobal: (next) => setState({ leaderboardGlobal: next }),
      setLeaderboardMine: (next) => setState({ leaderboardMine: next }),
      getLeaderboardTab: () => stateRef.leaderboardTab,
      setLeaderboardTab: (tab) => setState({ leaderboardTab: tab }),
      getLeaderboardOpen: () => stateRef.leaderboardOpen,
      getLastLeaderboardOpen: () => refs.leaderboard.lastOpen,
      setLastLeaderboardOpen: (value) => {
        refs.leaderboard.lastOpen = value;
      },
      getLeaderboardTimer: () => refs.leaderboard.timer,
      setLeaderboardTimer: (timer) => {
        refs.leaderboard.timer = timer;
      },
      getLeaderboardModeId: () => refs.leaderboard.modeId,
      setLeaderboardModeId: (id) => {
        refs.leaderboard.modeId = id;
      },
      getLastNicknameRefresh: () => refs.leaderboard.lastNickname,
      setLastNicknameRefresh: (value) => {
        refs.leaderboard.lastNickname = value;
      },
      getRequestId: () => refs.leaderboard.requestId,
      setRequestId: (value) => {
        refs.leaderboard.requestId = value;
      },
      raiseBackendError,
      limit: LEADERBOARD_LIMIT
    }
  });

  const configManager = createConfigManager({
    game,
    getSelectedModeId: () => stateRef.selectedModeId,
    getConfigDraft: () => stateRef.configDraft,
    setConfigDraft: (value) => setState({ configDraft: value }),
    setSelectedPreset: (value) => setState({ selectedPreset: value }),
    presets: HANDLING_PRESETS,
    customPresetId: CUSTOM_PRESET,
    persistConfig: (value) => persistConfig(STORAGE_KEY_CONFIG, value)
  });

  const setAudioMuted = (muted: boolean) => {
    setState({ audioMuted: muted });
    audio.setMuted(muted);
    persistAudioMuted(STORAGE_KEY_AUDIO, muted);
  };

  const toggleAudioMuted = () => {
    const next = !stateRef.audioMuted;
    if (!next && !refs.flags.audioUnlocked) {
      audio.unlock();
      refs.flags.audioUnlocked = true;
    }
    setAudioMuted(next);
  };

  const gameFlow = createGameFlow({
    game,
    input,
    audio,
    getSelectedModeId: () => stateRef.selectedModeId,
    setSelectedModeId: (modeId) => setState({ selectedModeId: modeId }),
    getConfigDraft: () => stateRef.configDraft,
    resetGame,
    getModeById,
    persistMode: (modeId) => persistMode(STORAGE_KEY_MODE, modeId),
    applyConfigToGame: configManager.applyConfigToGame,
    resetSessionState,
    startRunSession,
    setLastResult: (result) => setState({ lastResult: result }),
    setSubmitStatus: (status: SubmitStatus) => setState({ submitStatus: status }),
    setSubmitError: (error) => setState({ submitError: error }),
    setLastSubmittedKey: (value) => setState({ lastSubmittedKey: value }),
    setClearBanner: (banner) => {
      refs.frame.clearBanner = banner;
    },
    getShowViewportGuard: () => stateRef.showViewportGuard,
    getBypassViewportGuard: () => stateRef.bypassViewportGuard,
    getAudioUnlocked: () => refs.flags.audioUnlocked,
    setAudioUnlocked: (value) => {
      refs.flags.audioUnlocked = value;
    },
    getRestartCooldownUntil: () => stateRef.restartCooldownUntil,
    bumpRestartCooldown,
    cancelResumeCountdown,
    beginResumeCountdown,
    getResumeDeadline: () => refs.frame.resumeDeadline,
    setPausedForModal: (value) => {
      refs.flags.pausedForModal = value;
    },
    isCompetitiveMode
  });

  const layoutManager = createLayoutManager({
    getCanvas: () => refs.dom.canvasEl,
    getLayoutEl: () => refs.dom.layoutEl,
    getStageEl: () => refs.dom.stageEl,
    getRenderOptions: () => refs.render.options,
    setRenderOptions: (value) => {
      refs.render.options = value;
    },
    setCtx: (value) => {
      refs.render.ctx = value;
    },
    setShowViewportGuard: (value) => {
      setState({ showViewportGuard: value });
      if (value) setState({ bypassViewportGuard: false });
    },
    minViewportWidth: MIN_VIEWPORT_WIDTH,
    minViewportHeight: MIN_VIEWPORT_HEIGHT,
    minViewportAspect: MIN_VIEWPORT_ASPECT,
    minCellSize: MIN_CELL_SIZE
  });

  const focusTrap = createFocusTrap({
    isTrapOpen: () => stateRef.showControls || stateRef.showSettings || stateRef.leaderboardOpen,
    getActiveModalEl: () =>
      stateRef.showControls
        ? refs.dom.controlsCardEl
        : stateRef.showSettings
          ? refs.dom.settingsCardEl
          : stateRef.leaderboardOpen
            ? refs.dom.leaderboardCardEl
            : null
  });

  const resultsManager = createResultsManager({
    game,
    getModeById,
    getDisplayName: () => getDerived().displayName,
    getHasNickname: () => getDerived().hasNickname,
    getSessionInfo: () => stateRef.sessionInfo,
    getSessionStatus: () => stateRef.sessionStatus,
    getSessionError: () => stateRef.sessionError,
    getSessionPromise: () => refs.session.promise,
    setSessionInfo: (value) => {
      setState({ sessionInfo: value });
      handleSessionNonce(value);
    },
    getLastSubmittedKey: () => stateRef.lastSubmittedKey,
    setLastSubmittedKey: (value) => setState({ lastSubmittedKey: value }),
    setSubmitStatus: (status: SubmitStatus) => setState({ submitStatus: status }),
    setSubmitError: (error) => setState({ submitError: error }),
    setLastResult: (result) => setState({ lastResult: result }),
    getLastResult: () => stateRef.lastResult,
    raiseBackendError,
    refreshLeaderboards: async (mode) => {
      if (leaderboardController) await leaderboardController.refreshLeaderboards(mode);
    },
    clientVersion: CLIENT_VERSION
  });

  const selectMode = (modeId: GameModeId) => {
    setState({ selectedModeId: modeId });
    persistMode(STORAGE_KEY_MODE, modeId);
    configManager.applyConfigToGame(stateRef.configDraft);
    resetSessionState();
  };

  const saveNickname = () => {
    const trimmed = stateRef.nicknameDraft.trim();
    setState({ nickname: trimmed, nicknameDraft: trimmed });
    persistNickname(STORAGE_KEY_NICKNAME, trimmed);
    resetSessionState();
    void leaderboardController.refreshLeaderboards(getModeById(stateRef.ui.modeId));
  };

  const retrySubmit = () => {
    if (stateRef.lastResult) void resultsManager.submitResult(stateRef.lastResult, true);
  };

  const handleEvents = (events: ReturnType<typeof updateGame>) => {
    if (!refs.flags.audioUnlocked) return;
    if (events.hold) audio.play('hold');
    if (events.rotated) audio.play('rotate');
    if (events.hardDrop) audio.play('hardDrop');
    if (events.spinPreview?.kind && events.spinPreview.kind !== 'none') audio.play('spin');
    if (events.lockResult?.lines && events.lockResult.lines > 0) audio.play('line');
    if (events.locked) audio.play('lock');
    if (events.moved) audio.play('move');
  };

  const showClearBanner = (lockResult: LockResult, nowValue: number) => {
    const banner = buildClearBanner(lockResult, nowValue);
    if (banner) refs.frame.clearBanner = banner;
  };

  const frameLoop = createFrameLoop({
    game,
    input,
    updateGame,
    handleEvents,
    onTogglePause: gameFlow.togglePause,
    onRestart: gameFlow.restartGame,
    onFinalizeResults: resultsManager.finalizeResults,
    onShowClearBanner: showClearBanner,
    getShowViewportGuard: () => stateRef.showViewportGuard,
    getBypassViewportGuard: () => stateRef.bypassViewportGuard,
    getFixedDt: () => FIXED_DT,
    getAccumulator: () => refs.frame.accumulator,
    setAccumulator: (value) => {
      refs.frame.accumulator = value;
    },
    getResumeDeadline: () => refs.frame.resumeDeadline,
    setResumeDeadline: (value) => {
      refs.frame.resumeDeadline = value;
    },
    setResumeCountdown: (value) => setState({ resumeCountdown: value }),
    setGameStatus: (status: GameStatus) => {
      game.status = status;
      setState({ game });
    },
    getLastStatus: () => stateRef.lastStatus,
    setLastStatus: (status) => setState({ lastStatus: status }),
    getClearBanner: () => refs.frame.clearBanner,
    setClearBanner: (banner) => {
      refs.frame.clearBanner = banner;
    },
    getCtx: () => refs.render.ctx,
    getRenderOptions: () => refs.render.options,
    renderGame,
    updateUi
  });

  const pageLifecycle = createPageLifecycle({
    storage: {
      configKey: STORAGE_KEY_CONFIG,
      modeKey: STORAGE_KEY_MODE,
      nicknameKey: STORAGE_KEY_NICKNAME,
      audioKey: STORAGE_KEY_AUDIO,
      loadStoredConfig,
      loadStoredMode,
      loadStoredNickname,
      loadStoredAudioMuted
    },
    state: {
      getConfigDraft: () => stateRef.configDraft,
      setConfigDraft: (value) => setState({ configDraft: value }),
      applyConfigToGame: configManager.applyConfigToGame,
      setSelectedPreset: (value) => setState({ selectedPreset: value }),
      detectPreset: (value) => detectPreset(value, HANDLING_PRESETS, CUSTOM_PRESET),
      normalizeConfig,
      setNickname: (value) => setState({ nickname: value }),
      setNicknameDraft: (value) => setState({ nicknameDraft: value }),
      getAudioMuted: () => stateRef.audioMuted,
      setAudioMutedState: (value) => setState({ audioMuted: value })
    },
    mode: {
      selectMode,
      getSelectedModeId: () => stateRef.selectedModeId,
      getModeById,
      validModeIds: GAME_MODES.map((mode) => mode.id)
    },
    layout: layoutManager,
    leaderboard: { getController: () => leaderboardController ?? null },
    session: { getSessionInfo: () => stateRef.sessionInfo, cancelSessionBeacon: cancelLeaderboardSessionBeacon },
    input: {
      controller: input,
      getShowViewportGuard: () => stateRef.showViewportGuard,
      getBypassViewportGuard: () => stateRef.bypassViewportGuard,
      isAnyModalOpen,
      getGameStatus: () => game.status,
      pauseGame: gameFlow.togglePause,
      startGame: gameFlow.startGame,
      restartGame: gameFlow.restartGame
    },
    audio: {
      controller: audio,
      getAudioUnlocked: () => refs.flags.audioUnlocked,
      setAudioUnlocked: (value) => {
        refs.flags.audioUnlocked = value;
      }
    },
    frame: {
      setAccumulator: (value) => {
        refs.frame.accumulator = value;
      },
      handleFrameInput: frameLoop.handleFrameInput,
      stepSimulation: frameLoop.stepSimulation,
      finalizeFrame: frameLoop.finalizeFrame,
      maxFrameDelta: MAX_FRAME_DELTA
    },
    focusTrap
  });

  const stopLifecycleListeners = () => {
    focusTrap.cleanup();
  };

  const init = () => {
    const cleanup = pageLifecycle.init();
    return () => {
      cleanup();
      stopLifecycleListeners();
    };
  };

  const handleLeaderboardChange = () => {
    if (!browser || !leaderboardController) return;
    const derivedState = getDerived();
    if (derivedState.displayMode.id !== refs.leaderboard.modeId) {
      leaderboardController.handleModeChange(derivedState.displayMode);
    }
    if (stateRef.leaderboardOpen !== refs.leaderboard.lastOpen) {
      leaderboardController.handleOpenChange(derivedState.displayMode);
      refs.leaderboard.lastOpen = stateRef.leaderboardOpen;
    }
    if (derivedState.nicknameValue !== refs.leaderboard.lastNickname) {
      leaderboardController.handleNicknameChange(derivedState.displayMode);
      refs.leaderboard.lastNickname = derivedState.nicknameValue;
    }
  };

  stateStore.subscribe(() => {
    focusTrap.update(stateRef.showControls || stateRef.showSettings || stateRef.leaderboardOpen);
    handleLeaderboardChange();
  });

  const actions: GamePageActions = buildActions({
    gameFlow,
    saveNickname,
    retrySubmit,
    openControlsModal,
    openSettingsModal,
    openLeaderboardModal,
    closeModals,
    closeLeaderboardModal,
    toggleAudioMuted,
    setState,
    dismissBackendAlert
  });

  const elements: GamePageElements = buildElements(refs.dom);

  const view: GamePageView = buildView({
    stateStore,
    derivedStore,
    scoringLegend: SCORING_LEGEND,
    configManager,
    gameFlow,
    isCompetitiveMode
  });

  return { view, actions, elements, init };
};
