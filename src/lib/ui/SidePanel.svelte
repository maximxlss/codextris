<script lang="ts">
  import type { GameModeDefinition } from '$lib/game/modes';
  import type { GameModeId, GameStatus } from '$lib/game/types';
  import type { LeaderboardEntry, LeaderboardScope } from '$lib/game/leaderboard';
  import type { LeaderboardState } from '$lib/game/ui/leaderboardState';
  import './SidePanel.css';
  import type { UiState } from '$lib/ui/types';

  export let ui: UiState;
  export let selectedModeId: GameModeId;
  export let modes: GameModeDefinition[];
  export let displayMode: GameModeDefinition;

  export let statusLabel: (status: GameStatus) => string;
  export let modeTagline: (modeId: GameModeId) => string;
  export let requestModeSwitch: (modeId: GameModeId) => void;
  export let openSettingsModal: () => void;

  export let linesRemaining = 0;
  export let linesRemainingLabel = 'lines';
  export let goalLines: number | null = null;
  export let goalRemaining: number | null = null;
  export let goalRemainingLabel = 'lines';
  export let timeRemainingMs: number | null = null;

  export let formatClock: (ms: number, showMs?: boolean) => string;

  export let handlePrimaryAction: () => void;
  export let primaryLabel: (status: GameStatus) => string;
  export let canRestart: (status: GameStatus) => boolean;
  export let restartGame: () => void;
  export let resumeCountdown = 0;

  export let openControlsModal: () => void;
  export let toggleAudioMuted: () => void;
  export let audioMuted = false;

  export let leaderboardGlobal: LeaderboardState;
  export let leaderboardMine: LeaderboardState;
  export let globalTopEntry: LeaderboardEntry | null;
  export let mineTopEntry: LeaderboardEntry | null;
  export let hasNickname = false;
  export let currentMetricValue: number | null;
  export let globalRank: number | null;
  export let mineRank: number | null;
  export let formatMetricValue: (value: number | null, mode: GameModeDefinition) => string;
  export let formatRank: (rank: number | null, entriesLength: number) => string;
  export let openLeaderboardModal: (scope: LeaderboardScope) => void;
</script>

<aside class="side">
  <div class="brand">
    <p class="kicker">NEON TETRIS</p>
    <div class="brand-row">
      <h1>Codextris</h1>
      <span class={`status-pill ${ui.status}`}>{statusLabel(ui.status)}</span>
      <button class="ghost small settings-button" on:click={openSettingsModal}>
        Settings
      </button>
    </div>
  </div>
  <div class="mode-tabs">
    {#each modes as mode (mode.id)}
      <button
        class={`mode-tab ${selectedModeId === mode.id ? 'active' : ''}`}
        on:click={() => requestModeSwitch(mode.id)}
      >
        <span>{mode.label}</span>
        <small>{modeTagline(mode.id)}</small>
      </button>
    {/each}
  </div>
  <div class="stat-grid">
    {#if displayMode.id === 'zen'}
      <div class="stat-card">
        <span>Session time</span>
        <strong>{formatClock(ui.modeElapsedMs)}</strong>
      </div>
      <div class="stat-card">
        <span>Pieces</span>
        <strong>{ui.modePieces}</strong>
      </div>
      <div class="stat-card">
        <span>Level</span>
        <strong>{ui.level}</strong>
        <small>{linesRemaining} {linesRemainingLabel} to L{ui.level + 1}</small>
      </div>
      <div class="stat-card">
        <span>B2B</span>
        <strong class:muted={!ui.backToBack} class:accent={ui.backToBack}>
          {ui.backToBack ? `x${ui.b2bStreak}` : '—'}
        </strong>
      </div>
    {:else if displayMode.id === 'sprint40'}
      <div class="stat-card">
        <span>Time</span>
        <strong>{formatClock(ui.modeElapsedMs, true)}</strong>
      </div>
      <div class="stat-card">
        <span>Lines</span>
        <strong>{ui.lines}</strong>
        {#if goalLines !== null}
          <small>{goalRemaining} {goalRemainingLabel} to {goalLines}</small>
        {/if}
      </div>
      <div class="stat-card">
        <span>Level</span>
        <strong>{ui.level}</strong>
      </div>
      <div class="stat-card">
        <span>B2B</span>
        <strong class:muted={!ui.backToBack} class:accent={ui.backToBack}>
          {ui.backToBack ? `x${ui.b2bStreak}` : '—'}
        </strong>
      </div>
    {:else}
      <div class="stat-card">
        <span>Score</span>
        <strong>{ui.score}</strong>
      </div>
      <div class="stat-card">
        <span>Lines</span>
        <strong>{ui.lines}</strong>
      </div>
      <div class="stat-card">
        <span>Time left</span>
        <strong>{formatClock(timeRemainingMs ?? 0)}</strong>
      </div>
      <div class="stat-card">
        <span>B2B</span>
        <strong class:muted={!ui.backToBack} class:accent={ui.backToBack}>
          {ui.backToBack ? `x${ui.b2bStreak}` : '—'}
        </strong>
      </div>
    {/if}
  </div>
  <div class="button-stack">
    <button
      class="primary"
      on:click={handlePrimaryAction}
      disabled={ui.status === 'paused' && resumeCountdown > 0}
    >
      {primaryLabel(ui.status)}
    </button>
    <button class="ghost danger" on:click={restartGame} disabled={!canRestart(ui.status)}>
      Restart
    </button>
  </div>
  <div class="side-actions">
    <button class="ghost small" on:click={openControlsModal}>Controls/Scoring</button>
    <button
      class="ghost small toggle-muted"
      on:click={toggleAudioMuted}
      aria-pressed={audioMuted}
    >
      {audioMuted ? 'Sound off' : 'Sound on'}
    </button>
  </div>
  <div class="leaderboard-panel">
    <div class="leaderboard-header">
      <span>Leaderboards</span>
      {#if displayMode.metric}
        <button class="ghost small" on:click={() => openLeaderboardModal('global')}>
          View all
        </button>
      {/if}
    </div>
    <div class="leaderboard-grid">
      <button
        class="leaderboard-card"
        on:click={() => openLeaderboardModal('global')}
        disabled={!displayMode.metric}
      >
        <div class="leaderboard-title">
          <span>Global</span>
          {#if displayMode.metric}
            <small>{displayMode.metric === 'time' ? 'Best time' : 'Best score'}</small>
          {/if}
        </div>
        {#if !displayMode.metric}
          <p class="muted">Zen has no leaderboard. Runs fully offline.</p>
        {:else if leaderboardGlobal.status === 'loading'}
          <p class="muted">Loading...</p>
        {:else if leaderboardGlobal.status === 'error'}
          <p class="muted">Error loading</p>
        {:else if leaderboardGlobal.status === 'offline'}
          <p class="muted">Offline</p>
        {:else if globalTopEntry}
          <div class="leaderboard-entry">
            <strong>#1 {globalTopEntry.playerName}</strong>
            <span>{formatMetricValue(globalTopEntry.metricValue, displayMode)}</span>
          </div>
        {:else}
          <p class="muted">No scores yet</p>
        {/if}
        {#if displayMode.metric && ui.status !== 'menu'}
          <div class="leaderboard-current">
            <span>Current</span>
            <span>{formatMetricValue(currentMetricValue, displayMode)}</span>
            <span class="rank">
              {formatRank(globalRank, leaderboardGlobal.entries.length)}
            </span>
          </div>
        {/if}
      </button>
      <button
        class={`leaderboard-card ${!hasNickname ? 'guest' : ''}`}
        on:click={() => openLeaderboardModal('mine')}
        disabled={!displayMode.metric || !hasNickname}
      >
        <div class="leaderboard-title">
          <span>My scores</span>
          {#if displayMode.metric}
            <small>{displayMode.metric === 'time' ? 'Best time' : 'Best score'}</small>
          {/if}
          {#if !hasNickname}
            <span class="guest-pill">Guest</span>
          {/if}
        </div>
        {#if !displayMode.metric}
          <p class="muted">Zen has no leaderboard. Runs fully offline.</p>
        {:else if !hasNickname}
          <p class="muted warn">Guest mode: set a nickname to appear.</p>
        {:else if leaderboardMine.status === 'loading'}
          <p class="muted">Loading...</p>
        {:else if leaderboardMine.status === 'error'}
          <p class="muted">Error loading</p>
        {:else if leaderboardMine.status === 'offline'}
          <p class="muted">Offline</p>
        {:else if mineTopEntry}
          <div class="leaderboard-entry">
            <strong>#1 {mineTopEntry.playerName}</strong>
            <span>{formatMetricValue(mineTopEntry.metricValue, displayMode)}</span>
          </div>
        {:else}
          <p class="muted">No scores yet</p>
        {/if}
        {#if displayMode.metric && ui.status !== 'menu'}
          <div class="leaderboard-current">
            <span>Current</span>
            <span>{formatMetricValue(currentMetricValue, displayMode)}</span>
            <span class="rank">
              {formatRank(mineRank, leaderboardMine.entries.length)}
            </span>
          </div>
        {/if}
      </button>
    </div>
  </div>
</aside>
