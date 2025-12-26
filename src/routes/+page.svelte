<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
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
  import {
    type GameResult,
    type LeaderboardScope
  } from '$lib/game/leaderboard';
  import { cancelLeaderboardSessionBeacon, type SessionInfo } from '$lib/game/leaderboardApi';
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
  import { type SessionStatus } from '$lib/ui/page/session';
  import { createFocusTrap } from '$lib/ui/page/focusTrap';
  import { createLayoutManager } from '$lib/ui/page/layout';
  import { createModalManager, type BackendAlert } from '$lib/ui/page/modals';
  import { createPageControllers } from '$lib/ui/page/controllers';
  import { createPageLifecycle } from '$lib/ui/page/lifecycle';
  import '$lib/ui/GamePageView.css';
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
  import GamePageView from '$lib/ui/GamePageView.svelte';
  import type { UiState } from '$lib/ui/types';
  import {
    DEFAULT_CONFIG,
    DEFAULT_RULES,
    type GameConfig,
    type GameModeId,
    type GameStatus,
    type LockResult
  } from '$lib/game/types';
  import {
    CUSTOM_PRESET,
    HANDLING_PRESETS,
    type HandlingPresetId
  } from '$lib/ui/handlingPresets';
  let canvasEl: HTMLCanvasElement, layoutEl: HTMLElement, stageEl: HTMLDivElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let renderOptions = createRenderOptions(28);
  const input = new InputController(), audio = new AudioManager();
  let selectedModeId: GameModeId = DEFAULT_MODE_ID;
  let selectedMode = getModeById(selectedModeId);
  let configDraft: GameConfig = { ...DEFAULT_CONFIG };
  let game = createGameState(configDraft, undefined, selectedMode.rules, selectedMode.id);
  let showViewportGuard = false, bypassViewportGuard = false, audioUnlocked = false;
  let showControls = false, showSettings = false, pausedForModal = false;
  let controlsCardEl: HTMLDivElement, settingsCardEl: HTMLDivElement, leaderboardCardEl: HTMLDivElement;
  let clearBanner: ClearBanner | null = null;
  const SCORING_LEGEND = createScoringLegend(DEFAULT_RULES);
  let accumulator = 0;
  let ui: UiState = createUiState(game);
  let resumeDeadline = 0, resumeCountdown = 0;
  let audioMuted = false;
  let lastResult: GameResult | null = null, lastStatus: GameStatus = game.status;
  let nickname = '', nicknameDraft = '';
  let leaderboardGlobal: LeaderboardState = { status: 'idle', entries: [] };
  let leaderboardMine: LeaderboardState = { status: 'idle', entries: [] };
  let leaderboardOpen = false, leaderboardTab: LeaderboardScope = 'global';
  let leaderboardTimer: ReturnType<typeof setInterval> | null = null;
  let lastLeaderboardOpen = false;
  let submitStatus: 'idle' | 'pending' | 'success' | 'error' | 'offline' = 'idle';
  let submitError: string | null = null;
  let lastSubmittedKey: string | null = null;
  let sessionInfo: SessionInfo | null = null, sessionError: string | null = null, sessionStatus: SessionStatus = 'idle';
  let restartCooldownUntil = 0, lastSessionNonce = '';
  let sessionRequested = false, sessionPromise: Promise<void> | null = null;
  let sessionEpoch = 0;
  let backendAlerts: BackendAlert[] = [], backendAlertStack: BackendAlert[] = [];
  let leaderboardModeId: GameModeId | null = null, lastNicknameRefresh = '', leaderboardRequestId = 0;
  let nicknameValue = '', hasNickname = false, displayName = 'Guest';
  let linesPerLevel = 1, nextLevelTarget = 0, linesRemaining = 0, linesRemainingLabel = 'lines';
  let currentMode: GameModeDefinition = selectedMode, displayMode: GameModeDefinition = selectedMode;
  let resultTimeMs = 0, resultLines = 0, resultScore = 0, resultPieces = 0, resultPps = 0, resultLpm = 0;
  let goalLines: number | null = null, goalRemaining: number | null = null, goalRemainingLabel = 'lines';
  let timeRemainingMs: number | null = null;
  let globalTopEntry: LeaderboardState['entries'][number] | null = null;
  let mineTopEntry: LeaderboardState['entries'][number] | null = null;
  let activeLeaderboard: LeaderboardState = leaderboardGlobal;
  let activeEntries: LeaderboardState['entries'] = [];
  let currentMetricValue: number | null = null;
  let globalRank: number | null = null, mineRank: number | null = null;
  let globalRankLabel = '—', mineRankLabel = '—';
  $: {
    selectedMode = getModeById(selectedModeId);
    nicknameValue = nickname.trim();
    hasNickname = nicknameValue.length > 0;
    displayName = hasNickname ? nicknameValue : 'Guest';
  }
  $: {
    linesPerLevel = Math.max(1, game.rules.linesPerLevel);
    nextLevelTarget = ui.level * linesPerLevel;
    linesRemaining = Math.max(0, nextLevelTarget - ui.lines);
    linesRemainingLabel = linesRemaining === 1 ? 'line' : 'lines';
    currentMode = getModeById(ui.modeId);
    displayMode = ui.status === 'menu' ? selectedMode : currentMode;
    resultTimeMs = lastResult?.timeMs ?? ui.modeElapsedMs;
    resultLines = lastResult?.lines ?? ui.lines;
    resultScore = lastResult?.score ?? ui.score;
    resultPieces = lastResult?.pieces ?? ui.modePieces;
    resultPps = resultTimeMs > 0 ? resultPieces / (resultTimeMs / 1000) : 0;
    resultLpm = resultTimeMs > 0 ? resultLines / (resultTimeMs / 60000) : 0;
    goalLines = currentMode.goalLines ?? null;
    goalRemaining = goalLines !== null ? Math.max(0, goalLines - ui.lines) : null;
    goalRemainingLabel =
      goalRemaining === null ? 'lines' : goalRemaining === 1 ? 'line' : 'lines';
    timeRemainingMs =
      currentMode.timeLimitMs !== undefined && currentMode.timeLimitMs !== null
        ? Math.max(0, currentMode.timeLimitMs - ui.modeElapsedMs)
        : null;
  }
  $: {
    globalTopEntry = leaderboardGlobal.entries[0] ?? null;
    mineTopEntry = leaderboardMine.entries[0] ?? null;
    activeLeaderboard = leaderboardTab === 'global' ? leaderboardGlobal : leaderboardMine;
    activeEntries = activeLeaderboard.entries;
    currentMetricValue =
      displayMode.metric === 'time'
        ? ui.status === 'results' && lastResult
          ? lastResult.timeMs
          : ui.modeElapsedMs
        : displayMode.metric === 'score'
          ? ui.status === 'results' && lastResult
            ? lastResult.score
            : ui.score
          : null;
    globalRank = rankForMetric(displayMode, currentMetricValue, leaderboardGlobal.entries);
    mineRank = hasNickname
      ? rankForMetric(displayMode, currentMetricValue, leaderboardMine.entries)
      : null;
    globalRankLabel = formatRank(globalRank, leaderboardGlobal.entries.length);
    mineRankLabel = formatRank(mineRank, leaderboardMine.entries.length);
    backendAlertStack = [...backendAlerts].reverse();
  }
  $: {
    if (!sessionInfo?.nonce) {
      lastSessionNonce = '';
      if (Date.now() >= restartCooldownUntil) {
        restartCooldownUntil = 0;
      }
    } else if (sessionInfo.nonce !== lastSessionNonce) {
      lastSessionNonce = sessionInfo.nonce;
      restartCooldownUntil = Math.max(restartCooldownUntil, Date.now() + 1000);
    }
  }
  const bumpRestartCooldown = (durationMs = 1000) => {
    restartCooldownUntil = Math.max(restartCooldownUntil, Date.now() + durationMs);
  };
  $: if (browser && leaderboardController && displayMode.id !== leaderboardModeId) {
    leaderboardController.handleModeChange(displayMode);
  }
  $: if (browser && leaderboardController && leaderboardOpen !== lastLeaderboardOpen) {
    leaderboardController.handleOpenChange(displayMode);
  }
  $: if (browser && leaderboardController && nicknameValue !== lastNicknameRefresh) {
    leaderboardController.handleNicknameChange(displayMode);
  }
  let selectedPreset: HandlingPresetId = 'classic';
  const isCompetitiveMode = (mode: GameModeDefinition) => Boolean(mode.metric);
  const updateUi = () => (ui = createUiState(game));
  const beginResumeCountdown = () => {
    const started = startResumeCountdown(RESUME_COUNTDOWN_MS, performance.now());
    resumeDeadline = started.deadline;
    resumeCountdown = started.seconds;
    input.reset();
  };
  const cancelResumeCountdown = () => {
    resumeDeadline = 0;
    resumeCountdown = 0;
  };
  const modalManager = createModalManager({
    game, input,
    getShowControls: () => showControls, setShowControls: (value) => (showControls = value),
    getShowSettings: () => showSettings, setShowSettings: (value) => (showSettings = value),
    getLeaderboardOpen: () => leaderboardOpen, setLeaderboardOpen: (value) => (leaderboardOpen = value),
    getBackendAlerts: () => backendAlerts, setBackendAlerts: (value) => (backendAlerts = value),
    getPausedForModal: () => pausedForModal, setPausedForModal: (value) => (pausedForModal = value),
    getDisplayMode: () => displayMode, getHasNickname: () => hasNickname,
    setLeaderboardTab: (scope) => (leaderboardTab = scope),
    getLeaderboardController: () => leaderboardController ?? null,
    cancelResumeCountdown: () => cancelResumeCountdown(), beginResumeCountdown: () => beginResumeCountdown(),
    isCompetitiveMode, getModeById
  });
  const { isAnyModalOpen, raiseBackendError, dismissBackendAlert, openControlsModal, openSettingsModal, closeModals, openLeaderboardModal, closeLeaderboardModal } = modalManager;
  const { leaderboardController, resetSessionState, startRunSession } = createPageControllers({
    session: {
      getSessionEpoch: () => sessionEpoch, bumpSessionEpoch: () => (sessionEpoch += 1),
      getSessionInfo: () => sessionInfo, setSessionInfo: (info) => (sessionInfo = info),
      setSessionError: (error) => (sessionError = error), setSessionStatus: (status) => (sessionStatus = status),
      getSessionRequested: () => sessionRequested, setSessionRequested: (value) => (sessionRequested = value),
      setSessionPromise: (promise) => (sessionPromise = promise),
      getHasNickname: () => hasNickname, getDisplayName: () => displayName,
      raiseBackendError
    },
    leaderboard: {
      getModes: () => GAME_MODES,
      getHasNickname: () => hasNickname, getNicknameValue: () => nicknameValue,
      getLeaderboardGlobal: () => leaderboardGlobal, getLeaderboardMine: () => leaderboardMine,
      setLeaderboardGlobal: (state) => (leaderboardGlobal = state), setLeaderboardMine: (state) => (leaderboardMine = state),
      getLeaderboardTab: () => leaderboardTab, setLeaderboardTab: (tab) => (leaderboardTab = tab),
      getLeaderboardOpen: () => leaderboardOpen, getLastLeaderboardOpen: () => lastLeaderboardOpen,
      setLastLeaderboardOpen: (value) => (lastLeaderboardOpen = value),
      getLeaderboardTimer: () => leaderboardTimer, setLeaderboardTimer: (timer) => (leaderboardTimer = timer),
      getLeaderboardModeId: () => leaderboardModeId, setLeaderboardModeId: (id) => (leaderboardModeId = id),
      getLastNicknameRefresh: () => lastNicknameRefresh, setLastNicknameRefresh: (value) => (lastNicknameRefresh = value),
      getRequestId: () => leaderboardRequestId, setRequestId: (value) => (leaderboardRequestId = value),
      raiseBackendError, limit: LEADERBOARD_LIMIT
    }
  });
  const configManager = createConfigManager({
    game,
    getSelectedModeId: () => selectedModeId,
    getConfigDraft: () => configDraft,
    setConfigDraft: (value) => (configDraft = value),
    setSelectedPreset: (value) => (selectedPreset = value),
    presets: HANDLING_PRESETS,
    customPresetId: CUSTOM_PRESET,
    persistConfig: (value) => persistConfig(STORAGE_KEY_CONFIG, value)
  });
  const setAudioMuted = (muted: boolean) => {
    audioMuted = muted;
    audio.setMuted(muted);
    persistAudioMuted(STORAGE_KEY_AUDIO, muted);
  };
  const toggleAudioMuted = () => {
    const next = !audioMuted;
    if (!next && !audioUnlocked) {
      audio.unlock();
      audioUnlocked = true;
    }
    setAudioMuted(next);
  };
  const gameFlow = createGameFlow({
    game, input, audio,
    getSelectedModeId: () => selectedModeId, setSelectedModeId: (modeId) => (selectedModeId = modeId),
    getConfigDraft: () => configDraft, resetGame, getModeById,
    persistMode: (modeId) => persistMode(STORAGE_KEY_MODE, modeId),
    applyConfigToGame: configManager.applyConfigToGame,
    resetSessionState, startRunSession,
    setLastResult: (result) => (lastResult = result),
    setSubmitStatus: (status) => (submitStatus = status), setSubmitError: (error) => (submitError = error),
    setLastSubmittedKey: (value) => (lastSubmittedKey = value), setClearBanner: (banner) => (clearBanner = banner),
    getShowViewportGuard: () => showViewportGuard, getBypassViewportGuard: () => bypassViewportGuard,
    getAudioUnlocked: () => audioUnlocked, setAudioUnlocked: (value) => (audioUnlocked = value),
    getRestartCooldownUntil: () => restartCooldownUntil,
    bumpRestartCooldown,
    cancelResumeCountdown, beginResumeCountdown, getResumeDeadline: () => resumeDeadline,
    setPausedForModal: (value) => (pausedForModal = value), isCompetitiveMode
  });
  const { startGame, restartGame, togglePause, requestModeSwitch, returnToMenu, canRestart, primaryLabel, handlePrimaryAction } = gameFlow;
  const layoutManager = createLayoutManager({
    getCanvas: () => canvasEl, getLayoutEl: () => layoutEl, getStageEl: () => stageEl,
    getRenderOptions: () => renderOptions,
    setRenderOptions: (value) => (renderOptions = value), setCtx: (value) => (ctx = value),
    setShowViewportGuard: (value) => {
      showViewportGuard = value;
      if (value) {
        bypassViewportGuard = false;
      }
    },
    minViewportWidth: MIN_VIEWPORT_WIDTH,
    minViewportHeight: MIN_VIEWPORT_HEIGHT,
    minViewportAspect: MIN_VIEWPORT_ASPECT,
    minCellSize: MIN_CELL_SIZE
  });
  const getActiveModalEl = () => (showControls ? controlsCardEl : showSettings ? settingsCardEl : leaderboardOpen ? leaderboardCardEl : null);
  const focusTrap = createFocusTrap({
    isTrapOpen: () => showControls || showSettings || leaderboardOpen,
    getActiveModalEl
  });
  $: focusTrap.update(showControls || showSettings || leaderboardOpen);
  const resultsManager = createResultsManager({
    game, getModeById,
    getDisplayName: () => displayName, getHasNickname: () => hasNickname,
    getSessionInfo: () => sessionInfo, getSessionStatus: () => sessionStatus,
    getSessionError: () => sessionError, getSessionPromise: () => sessionPromise,
    setSessionInfo: (value) => (sessionInfo = value),
    getLastSubmittedKey: () => lastSubmittedKey, setLastSubmittedKey: (value) => (lastSubmittedKey = value),
    setSubmitStatus: (status) => (submitStatus = status), setSubmitError: (error) => (submitError = error),
    setLastResult: (result) => (lastResult = result), getLastResult: () => lastResult,
    raiseBackendError,
    refreshLeaderboards: async (mode) => { if (leaderboardController) await leaderboardController.refreshLeaderboards(mode); },
    clientVersion: CLIENT_VERSION
  });
  const selectMode = (modeId: GameModeId) => {
    selectedModeId = modeId;
    persistMode(STORAGE_KEY_MODE, modeId);
    configManager.applyConfigToGame(configDraft);
    resetSessionState();
  };
  const saveNickname = () => {
    const trimmed = nicknameDraft.trim();
    nickname = trimmed;
    nicknameDraft = trimmed;
    persistNickname(STORAGE_KEY_NICKNAME, trimmed);
    resetSessionState();
    void leaderboardController.refreshLeaderboards(displayMode);
  };
  const retrySubmit = () => {
    if (lastResult) void resultsManager.submitResult(lastResult, true);
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
  const showClearBanner = (lockResult: LockResult, now: number) => {
    const banner = buildClearBanner(lockResult, now);
    if (banner) clearBanner = banner;
  };
  const frameLoop = createFrameLoop({
    game, input, updateGame, handleEvents,
    onTogglePause: togglePause, onRestart: restartGame,
    onFinalizeResults: resultsManager.finalizeResults, onShowClearBanner: showClearBanner,
    getShowViewportGuard: () => showViewportGuard, getBypassViewportGuard: () => bypassViewportGuard,
    getFixedDt: () => FIXED_DT,
    getAccumulator: () => accumulator, setAccumulator: (value) => (accumulator = value),
    getResumeDeadline: () => resumeDeadline, setResumeDeadline: (value) => (resumeDeadline = value),
    setResumeCountdown: (value) => (resumeCountdown = value),
    setGameStatus: (status) => (game.status = status),
    getLastStatus: () => lastStatus, setLastStatus: (status) => (lastStatus = status),
    getClearBanner: () => clearBanner, setClearBanner: (banner) => (clearBanner = banner),
    getCtx: () => ctx, getRenderOptions: () => renderOptions, renderGame, updateUi
  });
  const { handleFrameInput, stepSimulation, finalizeFrame } = frameLoop;
  const pageLifecycle = createPageLifecycle({
    storage: { configKey: STORAGE_KEY_CONFIG, modeKey: STORAGE_KEY_MODE, nicknameKey: STORAGE_KEY_NICKNAME, audioKey: STORAGE_KEY_AUDIO, loadStoredConfig, loadStoredMode, loadStoredNickname, loadStoredAudioMuted },
    state: {
      getConfigDraft: () => configDraft, setConfigDraft: (value) => (configDraft = value),
      applyConfigToGame: configManager.applyConfigToGame,
      setSelectedPreset: (value) => (selectedPreset = value),
      detectPreset: (value) => detectPreset(value, HANDLING_PRESETS, CUSTOM_PRESET),
      normalizeConfig,
      setNickname: (value) => (nickname = value), setNicknameDraft: (value) => (nicknameDraft = value),
      getAudioMuted: () => audioMuted, setAudioMutedState: (value) => (audioMuted = value)
    },
    mode: { selectMode, getSelectedModeId: () => selectedModeId, getModeById, validModeIds: GAME_MODES.map((mode) => mode.id) },
    layout: layoutManager,
    leaderboard: { getController: () => leaderboardController ?? null },
    session: { getSessionInfo: () => sessionInfo, cancelSessionBeacon: cancelLeaderboardSessionBeacon },
    input: {
      controller: input, getShowViewportGuard: () => showViewportGuard, getBypassViewportGuard: () => bypassViewportGuard,
      isAnyModalOpen, getGameStatus: () => game.status, pauseGame: togglePause, startGame, restartGame
    },
    audio: { controller: audio, getAudioUnlocked: () => audioUnlocked, setAudioUnlocked: (value) => (audioUnlocked = value) },
    frame: { setAccumulator: (value) => (accumulator = value), handleFrameInput, stepSimulation, finalizeFrame, maxFrameDelta: MAX_FRAME_DELTA },
    focusTrap
  });
  onMount(() => pageLifecycle.init());
</script>
<svelte:head>
  <title>Codextris — Neon Tetris</title>
</svelte:head>
<GamePageView
  bind:layoutEl
  bind:stageEl
  bind:canvasEl
  bind:controlsCardEl
  bind:settingsCardEl
  bind:leaderboardCardEl
  bind:nicknameDraft
  bind:leaderboardTab
  {ui}
  {showViewportGuard}
  {bypassViewportGuard}
  onBypassViewportGuard={() => (bypassViewportGuard = true)}
  {selectedMode}
  {selectedPreset}
  presetName={configManager.presetName}
  {hasNickname}
  {mineTopEntry}
  {formatMetricValue}
  {startGame}
  {saveNickname}
  {resumeCountdown}
  {showControls}
  {showSettings}
  {leaderboardOpen}
  {currentMode}
  {isCompetitiveMode}
  {togglePause}
  {restartGame}
  {returnToMenu}
  {endReasonLabel}
  {resultTimeMs}
  {resultPieces}
  {resultLpm}
  {resultPps}
  {resultScore}
  {resultLines}
  {submitStatus}
  {submitError}
  {retrySubmit}
  {globalRankLabel}
  {mineRankLabel}
  {formatClock}
  {formatRate}
  {formatLeaderboardDate}
  {formatLeaderboardDateTime}
  {selectedModeId}
  modes={GAME_MODES}
  {displayMode}
  {statusLabel}
  {modeTagline}
  {requestModeSwitch}
  {openSettingsModal}
  {linesRemaining}
  {linesRemainingLabel}
  {goalLines}
  {goalRemaining}
  {goalRemainingLabel}
  {timeRemainingMs}
  {handlePrimaryAction}
  {primaryLabel}
  {canRestart}
  {openControlsModal}
  {toggleAudioMuted}
  {audioMuted}
  {leaderboardGlobal}
  {leaderboardMine}
  {globalTopEntry}
  {currentMetricValue}
  {globalRank}
  {mineRank}
  {formatRank}
  {openLeaderboardModal}
  {closeModals}
  {closeLeaderboardModal}
  presets={HANDLING_PRESETS}
  {CUSTOM_PRESET}
  applyPreset={configManager.applyPreset}
  handleNumberInput={configManager.handleNumberInput}
  {configDraft}
  scoringLegend={SCORING_LEGEND}
  {activeLeaderboard}
  {activeEntries}
  {backendAlertStack}
  dismissBackendAlert={dismissBackendAlert}
/>
