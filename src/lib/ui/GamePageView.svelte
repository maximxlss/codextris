<script lang="ts">
  import StageOverlays from '$lib/ui/StageOverlays.svelte';
  import SidePanel from '$lib/ui/SidePanel.svelte';
  import UiModals from '$lib/ui/UiModals.svelte';
  import BackendAlerts from '$lib/ui/BackendAlerts.svelte';
  import type { UiState } from '$lib/ui/types';
  import type { BackendAlert } from '$lib/ui/page/modals';
  import type { LeaderboardScope } from '$lib/game/leaderboard';
  import type { LeaderboardState } from '$lib/game/ui/leaderboardState';
  import type { GameConfig, GameEndReason, GameModeId } from '$lib/game/types';
  import type { GameModeDefinition } from '$lib/game/modes';
  import type { HandlingPresetId } from '$lib/ui/handlingPresets';

  type MetricFormatter = (value: number | null, mode: GameModeDefinition) => string;
  type ClockFormatter = (value: number, showMs?: boolean) => string;
  type RateFormatter = (value: number) => string;
  type DateFormatter = (value: string) => string;

  export let layoutEl: HTMLElement;
  export let stageEl: HTMLDivElement;
  export let canvasEl: HTMLCanvasElement;
  export let controlsCardEl: HTMLDivElement;
  export let settingsCardEl: HTMLDivElement;
  export let leaderboardCardEl: HTMLDivElement;

  export let ui: UiState;
  export let showViewportGuard: boolean;
  export let bypassViewportGuard: boolean;
  export let onBypassViewportGuard: () => void;
  export let selectedMode: GameModeDefinition;
  export let selectedPreset: HandlingPresetId;
  export let presetName: (presetId: HandlingPresetId) => string;
  export let nicknameDraft: string;
  export let hasNickname: boolean;
  export let mineTopEntry: LeaderboardState['entries'][number] | null;
  export let formatMetricValue: MetricFormatter;
  export let startGame: () => void;
  export let saveNickname: () => void;
  export let resumeCountdown: number;
  export let showControls: boolean;
  export let showSettings: boolean;
  export let leaderboardOpen: boolean;
  export let currentMode: GameModeDefinition;
  export let isCompetitiveMode: (mode: GameModeDefinition) => boolean;
  export let togglePause: () => void;
  export let restartGame: () => void;
  export let returnToMenu: () => void;
  export let endReasonLabel: (reason: GameEndReason | null) => string;
  export let resultTimeMs: number;
  export let resultPieces: number;
  export let resultLpm: number;
  export let resultPps: number;
  export let resultScore: number;
  export let resultLines: number;
  export let submitStatus: 'idle' | 'pending' | 'success' | 'error' | 'offline';
  export let submitError: string | null;
  export let retrySubmit: () => void;
  export let globalRankLabel: string;
  export let mineRankLabel: string;
  export let formatClock: ClockFormatter;
  export let formatRate: RateFormatter;
  export let formatLeaderboardDate: DateFormatter;
  export let formatLeaderboardDateTime: DateFormatter;

  export let selectedModeId: GameModeId;
  export let modes: GameModeDefinition[];
  export let displayMode: GameModeDefinition;
  export let statusLabel: (status: UiState['status']) => string;
  export let modeTagline: (modeId: GameModeId) => string;
  export let requestModeSwitch: (modeId: GameModeId) => void;
  export let openSettingsModal: () => void;
  export let linesRemaining: number;
  export let linesRemainingLabel: string;
  export let goalLines: number | null;
  export let goalRemaining: number | null;
  export let goalRemainingLabel: string;
  export let timeRemainingMs: number | null;
  export let handlePrimaryAction: () => void;
  export let primaryLabel: (status: UiState['status']) => string;
  export let canRestart: (status: UiState['status']) => boolean;
  export let openControlsModal: () => void;
  export let toggleAudioMuted: () => void;
  export let audioMuted: boolean;
  export let leaderboardGlobal: LeaderboardState;
  export let leaderboardMine: LeaderboardState;
  export let globalTopEntry: LeaderboardState['entries'][number] | null;
  export let currentMetricValue: number | null;
  export let globalRank: number | null;
  export let mineRank: number | null;
  export let formatRank: (rank: number | null, entriesLength: number) => string;
  export let openLeaderboardModal: (scope: LeaderboardScope) => void;

  export let closeModals: () => void;
  export let closeLeaderboardModal: () => void;
  export let presets: ReadonlyArray<{ id: HandlingPresetId; label: string; config: { dasMs: number; arrMs: number; softDropFactor: number } }>;
  export let CUSTOM_PRESET: HandlingPresetId;
  export let applyPreset: (presetId: HandlingPresetId) => void;
  export let handleNumberInput: (key: keyof GameConfig) => (event: Event) => void;
  export let configDraft: GameConfig;
  export let scoringLegend: Record<string, string>;
  export let leaderboardTab: LeaderboardScope;
  export let activeLeaderboard: LeaderboardState;
  export let activeEntries: LeaderboardState['entries'];

  export let backendAlertStack: BackendAlert[];
  export let dismissBackendAlert: (id: number) => void;
</script>

<main class="page">
  <section class="layout" bind:this={layoutEl}>
    <div class="stage" bind:this={stageEl}>
      <canvas class="board" bind:this={canvasEl} aria-label="Tetris game"></canvas>
      <StageOverlays
        {ui}
        {showViewportGuard}
        {bypassViewportGuard}
        onBypassViewportGuard={onBypassViewportGuard}
        {selectedMode}
        {selectedPreset}
        {presetName}
        bind:nicknameDraft
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
        {canRestart}
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
      />
    </div>
    <SidePanel
      {ui}
      {selectedModeId}
      {modes}
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
      {formatClock}
      {handlePrimaryAction}
      {primaryLabel}
      {canRestart}
      {restartGame}
      {openControlsModal}
      {toggleAudioMuted}
      {audioMuted}
      {leaderboardGlobal}
      {leaderboardMine}
      {globalTopEntry}
      {mineTopEntry}
      {hasNickname}
      {currentMetricValue}
      {globalRank}
      {mineRank}
      {formatMetricValue}
      {formatRank}
      {openLeaderboardModal}
      {resumeCountdown}
    />
  </section>
  <BackendAlerts alerts={backendAlertStack} onDismiss={dismissBackendAlert} />
  <UiModals
    {showSettings}
    {showControls}
    {leaderboardOpen}
    {closeModals}
    {closeLeaderboardModal}
    bind:settingsCardEl
    bind:controlsCardEl
    bind:leaderboardCardEl
    bind:nicknameDraft
    {saveNickname}
    {presets}
    {selectedPreset}
    {CUSTOM_PRESET}
    {applyPreset}
    {handleNumberInput}
    {configDraft}
    scoringLegend={scoringLegend}
    {displayMode}
    bind:leaderboardTab
    {activeLeaderboard}
    {activeEntries}
    {hasNickname}
    {formatMetricValue}
    {formatClock}
    {formatRate}
    {formatLeaderboardDate}
    {formatLeaderboardDateTime}
  />
</main>
