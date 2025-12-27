<script lang="ts">
  import './SidePanel.css';
  import { getGamePageContext } from '$lib/ui/game-page';

  const { view, actions } = getGamePageContext();
  const state = view.state;
  const derived = view.derived;
  const format = view.format;
  const labels = view.labels;
  const helpers = view.helpers;

  const getNameSizeClass = (name: string) => {
    const length = name.trim().length;
    if (length > 16) return 'name-micro';
    if (length > 12) return 'name-tight';
    return '';
  };
</script>

<aside class="side">
  <div class="brand">
    <p class="kicker">NEON TETRIS</p>
    <div class="brand-row">
      <h1>Codextris</h1>
      <span class={`status-pill ${$state.ui.status}`}>{labels.statusLabel($state.ui.status)}</span>
      <button class="ghost small settings-button" on:click={actions.openSettingsModal}>
        Settings
      </button>
    </div>
  </div>
  <div class="mode-tabs">
    {#each view.modes as mode (mode.id)}
      <button
        class={`mode-tab ${$state.selectedModeId === mode.id ? 'active' : ''}`}
        on:click={() => actions.requestModeSwitch(mode.id)}
      >
        <span>{mode.label}</span>
        <small>{labels.modeTagline(mode.id)}</small>
      </button>
    {/each}
  </div>
  <div class="stat-grid">
    {#if $derived.displayMode.id === 'zen'}
      <div class="stat-card">
        <span>Session time</span>
        <strong>{format.formatClock($state.ui.modeElapsedMs)}</strong>
      </div>
      <div class="stat-card">
        <span>Pieces</span>
        <strong>{$state.ui.modePieces}</strong>
      </div>
      <div class="stat-card">
        <span>Level</span>
        <strong>{$state.ui.level}</strong>
        <small>{$derived.linesRemaining} {$derived.linesRemainingLabel} to L{$state.ui.level + 1}</small>
      </div>
      <div class="stat-card">
        <span>B2B</span>
        <strong class:muted={!$state.ui.backToBack} class:accent={$state.ui.backToBack}>
          {$state.ui.backToBack ? `x${$state.ui.b2bStreak}` : '—'}
        </strong>
      </div>
    {:else if $derived.displayMode.id === 'sprint40'}
      <div class="stat-card">
        <span>Time</span>
        <strong>{format.formatClock($state.ui.modeElapsedMs, true)}</strong>
      </div>
      <div class="stat-card">
        <span>Lines</span>
        <strong>{$state.ui.lines}</strong>
        {#if $derived.goalLines !== null}
          <small>{$derived.goalRemaining} {$derived.goalRemainingLabel} to {$derived.goalLines}</small>
        {/if}
      </div>
      <div class="stat-card">
        <span>Level</span>
        <strong>{$state.ui.level}</strong>
      </div>
      <div class="stat-card">
        <span>B2B</span>
        <strong class:muted={!$state.ui.backToBack} class:accent={$state.ui.backToBack}>
          {$state.ui.backToBack ? `x${$state.ui.b2bStreak}` : '—'}
        </strong>
      </div>
    {:else}
      <div class="stat-card">
        <span>Score</span>
        <strong>{$state.ui.score}</strong>
      </div>
      <div class="stat-card">
        <span>Lines</span>
        <strong>{$state.ui.lines}</strong>
      </div>
      <div class="stat-card">
        <span>Time left</span>
        <strong>{format.formatClock($derived.timeRemainingMs ?? 0)}</strong>
      </div>
      <div class="stat-card">
        <span>B2B</span>
        <strong class:muted={!$state.ui.backToBack} class:accent={$state.ui.backToBack}>
          {$state.ui.backToBack ? `x${$state.ui.b2bStreak}` : '—'}
        </strong>
      </div>
    {/if}
  </div>
  <div class="button-stack">
    <button
      class="primary"
      on:click={actions.handlePrimaryAction}
      disabled={$state.ui.status === 'paused' && $state.resumeCountdown > 0}
    >
      {helpers.primaryLabel($state.ui.status)}
    </button>
    <button class="ghost danger" on:click={actions.restartGame} disabled={!helpers.canRestart($state.ui.status)}>
      Restart
    </button>
  </div>
  <div class="side-actions">
    <button class="ghost small" on:click={actions.openControlsModal}>Controls/Scoring</button>
    <button
      class="ghost small toggle-muted"
      on:click={actions.toggleAudioMuted}
      aria-pressed={$state.audioMuted}
    >
      {$state.audioMuted ? 'Sound off' : 'Sound on'}
    </button>
  </div>
  <div class="leaderboard-panel">
    <div class="leaderboard-header">
      <span>Leaderboards</span>
      {#if $derived.displayMode.metric}
        <button class="ghost small" on:click={() => actions.openLeaderboardModal('global')}>
          View all
        </button>
      {/if}
    </div>
    <div class="leaderboard-grid">
      <button
        class="leaderboard-card"
        on:click={() => actions.openLeaderboardModal('global')}
        disabled={!$derived.displayMode.metric}
      >
        <div class="leaderboard-title">
          <span>Global</span>
          {#if $derived.displayMode.metric}
            <small>{$derived.displayMode.metric === 'time' ? 'Best time' : 'Best score'}</small>
          {/if}
        </div>
        {#if !$derived.displayMode.metric}
          <p class="muted">Zen has no leaderboard. Runs fully offline.</p>
        {:else if $state.leaderboardGlobal.status === 'loading'}
          <p class="muted">Loading...</p>
        {:else if $state.leaderboardGlobal.status === 'error'}
          <p class="muted">Error loading</p>
        {:else if $state.leaderboardGlobal.status === 'offline'}
          <p class="muted">Offline</p>
        {:else if $derived.globalTopEntry}
          <div class="leaderboard-entry">
            <strong
              class={getNameSizeClass($derived.globalTopEntry.playerName)}
              title={$derived.globalTopEntry.playerName}
            >
              #1 {$derived.globalTopEntry.playerName}
            </strong>
            <span>{format.formatMetricValue($derived.globalTopEntry.metricValue, $derived.displayMode)}</span>
          </div>
        {:else}
          <p class="muted">No scores yet</p>
        {/if}
        {#if $derived.displayMode.metric && $state.ui.status !== 'menu'}
          <div class="leaderboard-current">
            <span>Current</span>
            <span>{format.formatMetricValue($derived.currentMetricValue, $derived.displayMode)}</span>
            <span class="rank">
              {format.formatRank($derived.globalRank, $state.leaderboardGlobal.entries.length)}
            </span>
          </div>
        {/if}
      </button>
      <button
        class={`leaderboard-card ${!$derived.hasNickname ? 'guest' : ''}`}
        on:click={() => actions.openLeaderboardModal('mine')}
        disabled={!$derived.displayMode.metric || !$derived.hasNickname}
      >
        <div class="leaderboard-title">
          <span>My scores</span>
          {#if $derived.displayMode.metric}
            <small>{$derived.displayMode.metric === 'time' ? 'Best time' : 'Best score'}</small>
          {/if}
          {#if !$derived.hasNickname}
            <span class="guest-pill">Guest</span>
          {/if}
        </div>
        {#if !$derived.displayMode.metric}
          <p class="muted">Zen has no leaderboard. Runs fully offline.</p>
        {:else if !$derived.hasNickname}
          <p class="muted warn">Guest mode: set a nickname to appear.</p>
        {:else if $state.leaderboardMine.status === 'loading'}
          <p class="muted">Loading...</p>
        {:else if $state.leaderboardMine.status === 'error'}
          <p class="muted">Error loading</p>
        {:else if $state.leaderboardMine.status === 'offline'}
          <p class="muted">Offline</p>
        {:else if $derived.mineTopEntry}
          <div class="leaderboard-entry">
            <strong class={getNameSizeClass($derived.mineTopEntry.playerName)} title={$derived.mineTopEntry.playerName}>
              #1 {$derived.mineTopEntry.playerName}
            </strong>
            <span>{format.formatMetricValue($derived.mineTopEntry.metricValue, $derived.displayMode)}</span>
          </div>
        {:else}
          <p class="muted">No scores yet</p>
        {/if}
        {#if $derived.displayMode.metric && $state.ui.status !== 'menu'}
          <div class="leaderboard-current">
            <span>Current</span>
            <span>{format.formatMetricValue($derived.currentMetricValue, $derived.displayMode)}</span>
            <span class="rank">
              {format.formatRank($derived.mineRank, $state.leaderboardMine.entries.length)}
            </span>
          </div>
        {/if}
      </button>
    </div>
  </div>
</aside>
