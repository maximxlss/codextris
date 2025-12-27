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
import {
  formatClock,
  formatMetricValue,
  formatRank,
  formatRate,
  formatLeaderboardDate,
  formatLeaderboardDateTime
} from '$lib/game/ui/format';
import { startResumeCountdown } from '$lib/game/ui/resume';
import { endReasonLabel, modeTagline, statusLabel } from '$lib/ui/labels';
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
import type { UiState } from '$lib/ui/types';
import { deriveGamePage } from './derive';
import type { GamePageState, SubmitStatus } from './state';

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

const createInitialState = (
  game: GameState,
  ui: UiState,
  configDraft: GameConfig,
  selectedModeId: GameModeId
): GamePageState => ({
  game,
  ui,
  configDraft,
  selectedModeId,
  selectedPreset: 'classic',
  nickname: '',
  nicknameDraft: '',
  audioMuted: false,
  showControls: false,
  showSettings: false,
  leaderboardOpen: false,
  leaderboardTab: 'global',
  showViewportGuard: false,
  bypassViewportGuard: false,
  resumeCountdown: 0,
  submitStatus: 'idle',
  submitError: null,
  lastResult: null,
  lastStatus: game.status,
  leaderboardGlobal: { status: 'idle', entries: [] },
  leaderboardMine: { status: 'idle', entries: [] },
  backendAlerts: [],
  restartCooldownUntil: 0,
  sessionInfo: null,
  sessionError: null,
  sessionStatus: 'idle',
  lastSubmittedKey: null
});

export const createGamePageController = (options: ControllerOptions = {}): GamePageController => {
  const now = options.now ?? (() => Date.now());

  let canvasEl: HTMLCanvasElement | null = null;
  let layoutEl: HTMLElement | null = null;
  let stageEl: HTMLDivElement | null = null;
  let controlsCardEl: HTMLDivElement | null = null;
  let settingsCardEl: HTMLDivElement | null = null;
  let leaderboardCardEl: HTMLDivElement | null = null;

  let ctx: CanvasRenderingContext2D | null = null;
  let renderOptions = createRenderOptions(28);

  const input = new InputController();
  const audio = new AudioManager();
  let audioUnlocked = false;
  let pausedForModal = false;

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

  let accumulator = 0;
  let resumeDeadline = 0;
  let clearBanner: ClearBanner | null = null;
  let leaderboardTimer: ReturnType<typeof setInterval> | null = null;
  let lastLeaderboardOpen = false;
  let lastSessionNonce = '';
  let sessionRequested = false;
  let sessionPromise: Promise<void> | null = null;
  let sessionEpoch = 0;
  let leaderboardModeId: GameModeId | null = null;
  let lastNicknameRefresh = '';
  let leaderboardRequestId = 0;

  const SCORING_LEGEND = createScoringLegend(DEFAULT_RULES);

  const isCompetitiveMode = (mode: GameModeDefinition) => Boolean(mode.metric);

  const updateUi = () => {
    setState({ ui: createUiState(game) });
  };

  const beginResumeCountdown = () => {
    const started = startResumeCountdown(RESUME_COUNTDOWN_MS, performance.now());
    resumeDeadline = started.deadline;
    setState({ resumeCountdown: started.seconds });
    input.reset();
  };

  const cancelResumeCountdown = () => {
    resumeDeadline = 0;
    setState({ resumeCountdown: 0 });
  };

  const bumpRestartCooldown = (durationMs = 1000) => {
    const next = Math.max(stateRef.restartCooldownUntil, now() + durationMs);
    setState({ restartCooldownUntil: next });
  };

  const handleSessionNonce = (session: SessionInfo | null) => {
    if (!session?.nonce) {
      lastSessionNonce = '';
      if (now() >= stateRef.restartCooldownUntil) {
        setState({ restartCooldownUntil: 0 });
      }
      return;
    }
    if (session.nonce !== lastSessionNonce) {
      lastSessionNonce = session.nonce;
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
    getPausedForModal: () => pausedForModal,
    setPausedForModal: (value) => {
      pausedForModal = value;
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
      getSessionEpoch: () => sessionEpoch,
      bumpSessionEpoch: () => (sessionEpoch += 1),
      getSessionInfo: () => stateRef.sessionInfo,
      setSessionInfo: (info) => {
        setState({ sessionInfo: info });
        handleSessionNonce(info);
      },
      setSessionError: (error) => setState({ sessionError: error }),
      setSessionStatus: (status) => setState({ sessionStatus: status }),
      getSessionRequested: () => sessionRequested,
      setSessionRequested: (value) => {
        sessionRequested = value;
      },
      setSessionPromise: (promise) => {
        sessionPromise = promise;
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
      getLastLeaderboardOpen: () => lastLeaderboardOpen,
      setLastLeaderboardOpen: (value) => {
        lastLeaderboardOpen = value;
      },
      getLeaderboardTimer: () => leaderboardTimer,
      setLeaderboardTimer: (timer) => {
        leaderboardTimer = timer;
      },
      getLeaderboardModeId: () => leaderboardModeId,
      setLeaderboardModeId: (id) => {
        leaderboardModeId = id;
      },
      getLastNicknameRefresh: () => lastNicknameRefresh,
      setLastNicknameRefresh: (value) => {
        lastNicknameRefresh = value;
      },
      getRequestId: () => leaderboardRequestId,
      setRequestId: (value) => {
        leaderboardRequestId = value;
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
    if (!next && !audioUnlocked) {
      audio.unlock();
      audioUnlocked = true;
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
      clearBanner = banner;
    },
    getShowViewportGuard: () => stateRef.showViewportGuard,
    getBypassViewportGuard: () => stateRef.bypassViewportGuard,
    getAudioUnlocked: () => audioUnlocked,
    setAudioUnlocked: (value) => {
      audioUnlocked = value;
    },
    getRestartCooldownUntil: () => stateRef.restartCooldownUntil,
    bumpRestartCooldown,
    cancelResumeCountdown,
    beginResumeCountdown,
    getResumeDeadline: () => resumeDeadline,
    setPausedForModal: (value) => {
      pausedForModal = value;
    },
    isCompetitiveMode
  });

  const layoutManager = createLayoutManager({
    getCanvas: () => canvasEl,
    getLayoutEl: () => layoutEl,
    getStageEl: () => stageEl,
    getRenderOptions: () => renderOptions,
    setRenderOptions: (value) => {
      renderOptions = value;
    },
    setCtx: (value) => {
      ctx = value;
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
        ? controlsCardEl
        : stateRef.showSettings
          ? settingsCardEl
          : stateRef.leaderboardOpen
            ? leaderboardCardEl
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
    getSessionPromise: () => sessionPromise,
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
    if (!audioUnlocked) return;
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
    if (banner) clearBanner = banner;
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
    getAccumulator: () => accumulator,
    setAccumulator: (value) => {
      accumulator = value;
    },
    getResumeDeadline: () => resumeDeadline,
    setResumeDeadline: (value) => {
      resumeDeadline = value;
    },
    setResumeCountdown: (value) => setState({ resumeCountdown: value }),
    setGameStatus: (status: GameStatus) => {
      game.status = status;
      setState({ game });
    },
    getLastStatus: () => stateRef.lastStatus,
    setLastStatus: (status) => setState({ lastStatus: status }),
    getClearBanner: () => clearBanner,
    setClearBanner: (banner) => {
      clearBanner = banner;
    },
    getCtx: () => ctx,
    getRenderOptions: () => renderOptions,
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
      getAudioUnlocked: () => audioUnlocked,
      setAudioUnlocked: (value) => {
        audioUnlocked = value;
      }
    },
    frame: {
      setAccumulator: (value) => {
        accumulator = value;
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
    if (derivedState.displayMode.id !== leaderboardModeId) {
      leaderboardController.handleModeChange(derivedState.displayMode);
    }
    if (stateRef.leaderboardOpen !== lastLeaderboardOpen) {
      leaderboardController.handleOpenChange(derivedState.displayMode);
      lastLeaderboardOpen = stateRef.leaderboardOpen;
    }
    if (derivedState.nicknameValue !== lastNicknameRefresh) {
      leaderboardController.handleNicknameChange(derivedState.displayMode);
      lastNicknameRefresh = derivedState.nicknameValue;
    }
  };

  stateStore.subscribe(() => {
    focusTrap.update(stateRef.showControls || stateRef.showSettings || stateRef.leaderboardOpen);
    handleLeaderboardChange();
  });

  const actions: GamePageActions = {
    startGame: gameFlow.startGame,
    restartGame: gameFlow.restartGame,
    togglePause: gameFlow.togglePause,
    returnToMenu: gameFlow.returnToMenu,
    requestModeSwitch: gameFlow.requestModeSwitch,
    saveNickname,
    retrySubmit,
    handlePrimaryAction: gameFlow.handlePrimaryAction,
    openControlsModal,
    openSettingsModal,
    openLeaderboardModal,
    closeModals,
    closeLeaderboardModal,
    toggleAudioMuted,
    onBypassViewportGuard: () => setState({ bypassViewportGuard: true }),
    setLeaderboardTab: (scope) => setState({ leaderboardTab: scope }),
    setNicknameDraft: (value) => setState({ nicknameDraft: value }),
    dismissBackendAlert
  };

  const elements: GamePageElements = {
    setCanvas: (el) => {
      canvasEl = el;
    },
    setLayout: (el) => {
      layoutEl = el;
    },
    setStage: (el) => {
      stageEl = el;
    },
    setControlsCard: (el) => {
      controlsCardEl = el;
    },
    setSettingsCard: (el) => {
      settingsCardEl = el;
    },
    setLeaderboardCard: (el) => {
      leaderboardCardEl = el;
    }
  };

  const view: GamePageView = {
    state: stateStore,
    derived: derivedStore,
    modes: GAME_MODES,
    presets: HANDLING_PRESETS,
    scoringLegend: SCORING_LEGEND,
    config: {
      presetName: configManager.presetName,
      applyPreset: configManager.applyPreset,
      handleNumberInput: configManager.handleNumberInput
    },
    helpers: {
      isCompetitiveMode,
      canRestart: gameFlow.canRestart,
      primaryLabel: gameFlow.primaryLabel
    },
    format: {
      formatClock,
      formatRate,
      formatMetricValue,
      formatRank,
      formatLeaderboardDate,
      formatLeaderboardDateTime
    },
    labels: {
      endReasonLabel,
      statusLabel,
      modeTagline
    },
    constants: {
      customPresetId: CUSTOM_PRESET
    }
  };

  return { view, actions, elements, init };
};
