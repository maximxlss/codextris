import type { Readable } from 'svelte/store';
import type { GameModeDefinition } from '$lib/game/modes';
import { GAME_MODES } from '$lib/game/modes';
import type { GameModeId, GameStatus, GameConfig } from '$lib/game/types';
import type { LeaderboardScope } from '$lib/game/leaderboard';
import {
  formatClock,
  formatMetricValue,
  formatRank,
  formatRate,
  formatLeaderboardDate,
  formatLeaderboardDateTime
} from '$lib/game/ui/format';
import { endReasonLabel, modeTagline, statusLabel } from '$lib/ui/labels';
import { CUSTOM_PRESET, HANDLING_PRESETS, type HandlingPresetId } from '$lib/ui/handlingPresets';
import type { GamePageState } from './state';
import type { deriveGamePage } from './derive';

export type DomRefs = {
  canvasEl: HTMLCanvasElement | null;
  layoutEl: HTMLElement | null;
  stageEl: HTMLDivElement | null;
  controlsCardEl: HTMLDivElement | null;
  settingsCardEl: HTMLDivElement | null;
  leaderboardCardEl: HTMLDivElement | null;
};

type GameFlowActions = {
  startGame: () => void;
  restartGame: () => void;
  togglePause: () => void;
  returnToMenu: () => void;
  requestModeSwitch: (modeId: GameModeId) => void;
  handlePrimaryAction: () => void;
  canRestart: (status: GameStatus) => boolean;
  primaryLabel: (status: GameStatus) => string;
};

type ConfigManagerView = {
  presetName: (presetId: HandlingPresetId) => string;
  applyPreset: (presetId: HandlingPresetId) => void;
  handleNumberInput: (key: keyof GameConfig) => (event: Event) => void;
};

type BuildActionsDeps = {
  gameFlow: GameFlowActions;
  saveNickname: () => void;
  retrySubmit: () => void;
  openControlsModal: () => void;
  openSettingsModal: () => void;
  openLeaderboardModal: (scope: LeaderboardScope) => void;
  closeModals: () => void;
  closeLeaderboardModal: () => void;
  toggleAudioMuted: () => void;
  setState: (patch: Partial<GamePageState>) => void;
  dismissBackendAlert: (id: number) => void;
};

type BuildViewDeps = {
  stateStore: Readable<GamePageState>;
  derivedStore: Readable<ReturnType<typeof deriveGamePage>>;
  scoringLegend: Record<string, string>;
  configManager: ConfigManagerView;
  gameFlow: Pick<GameFlowActions, 'canRestart' | 'primaryLabel'>;
  isCompetitiveMode: (mode: GameModeDefinition) => boolean;
};

export const buildElements = (dom: DomRefs) => ({
  setCanvas: (el: HTMLCanvasElement | null) => {
    dom.canvasEl = el;
  },
  setLayout: (el: HTMLElement | null) => {
    dom.layoutEl = el;
  },
  setStage: (el: HTMLDivElement | null) => {
    dom.stageEl = el;
  },
  setControlsCard: (el: HTMLDivElement | null) => {
    dom.controlsCardEl = el;
  },
  setSettingsCard: (el: HTMLDivElement | null) => {
    dom.settingsCardEl = el;
  },
  setLeaderboardCard: (el: HTMLDivElement | null) => {
    dom.leaderboardCardEl = el;
  }
});

export const buildActions = (deps: BuildActionsDeps) => ({
  startGame: deps.gameFlow.startGame,
  restartGame: deps.gameFlow.restartGame,
  togglePause: deps.gameFlow.togglePause,
  returnToMenu: deps.gameFlow.returnToMenu,
  requestModeSwitch: deps.gameFlow.requestModeSwitch,
  saveNickname: deps.saveNickname,
  retrySubmit: deps.retrySubmit,
  handlePrimaryAction: deps.gameFlow.handlePrimaryAction,
  openControlsModal: deps.openControlsModal,
  openSettingsModal: deps.openSettingsModal,
  openLeaderboardModal: deps.openLeaderboardModal,
  closeModals: deps.closeModals,
  closeLeaderboardModal: deps.closeLeaderboardModal,
  toggleAudioMuted: deps.toggleAudioMuted,
  onBypassViewportGuard: () => deps.setState({ bypassViewportGuard: true }),
  setLeaderboardTab: (scope: LeaderboardScope) => deps.setState({ leaderboardTab: scope }),
  setNicknameDraft: (value: string) => deps.setState({ nicknameDraft: value }),
  dismissBackendAlert: deps.dismissBackendAlert
});

export const buildView = (deps: BuildViewDeps) => ({
  state: deps.stateStore,
  derived: deps.derivedStore,
  modes: GAME_MODES,
  presets: HANDLING_PRESETS,
  scoringLegend: deps.scoringLegend,
  config: {
    presetName: deps.configManager.presetName,
    applyPreset: deps.configManager.applyPreset,
    handleNumberInput: deps.configManager.handleNumberInput
  },
  helpers: {
    isCompetitiveMode: deps.isCompetitiveMode,
    canRestart: deps.gameFlow.canRestart,
    primaryLabel: deps.gameFlow.primaryLabel
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
});
