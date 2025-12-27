<script lang="ts">
  import './StageOverlays.css';
  import { getGamePageContext } from '$lib/ui/game-page';

  const { view, actions } = getGamePageContext();
  const state = view.state;
  const derived = view.derived;
  const format = view.format;
  const labels = view.labels;
  const config = view.config;
  const helpers = view.helpers;

  const handleNicknameInput = (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    actions.setNicknameDraft(target?.value ?? '');
  };
</script>

{#if $state.showViewportGuard && !$state.bypassViewportGuard}
  <div class="overlay guard">
    <div class="onboard-card">
      <h2>Screen too small</h2>
      <p>This layout needs more space to stay readable. Try a wider window or landscape orientation.</p>
      <button class="primary" on:click={actions.onBypassViewportGuard}>Continue anyway</button>
    </div>
  </div>
{/if}

{#if $state.ui.status === 'menu' && (!$state.showViewportGuard || $state.bypassViewportGuard)}
  <div class="overlay ready">
    <div class="onboard-card">
      <p class="onboard-tag">Choose a mode</p>
      <h2>Ready?</h2>
      <p class="intro-guide">
        Pick a mode, tune handling, set a nickname, and chase the leaderboards. Everything you need is on the right.
      </p>
      <div class="selected-mode">
        <span>Selected mode</span>
        <strong>{$derived.selectedMode.label}</strong>
      </div>
      <p class="mode-hint">
        Handling preset: <strong>{config.presetName($state.selectedPreset)}</strong>
      </p>
      <div class="nickname-card compact">
        <div class="nickname-header">
          <span>Nickname</span>
          {#if $derived.hasNickname}
            <span class="nickname-pill">Saved</span>
          {/if}
        </div>
        <div class="nickname-row">
          <input
            type="text"
            placeholder="Set your name"
            value={$state.nicknameDraft}
            on:input={handleNicknameInput}
            on:keydown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                actions.saveNickname();
              }
            }}
          />
          <button class="ghost small" on:click={actions.saveNickname}>Save</button>
        </div>
        <p class="nickname-hint">Set a nickname to appear on leaderboards.</p>
      </div>
      {#if $derived.selectedMode.metric}
        {#if $derived.hasNickname && $derived.mineTopEntry}
          <div class="best-card">
            <span class="result-label">My best</span>
            <strong>{format.formatMetricValue($derived.mineTopEntry.metricValue, $derived.selectedMode)}</strong>
          </div>
        {/if}
      {/if}
      <div class="onboard-actions">
        <button class="primary" on:click={actions.startGame}>Start</button>
      </div>
      <div class="onboard-keys">
        <span><kbd>Enter</kbd> Start</span>
        <span><kbd>←</kbd><kbd>→</kbd> Move</span>
        <span><kbd>↑</kbd>/<kbd>X</kbd>/<kbd>Z</kbd> Rotate</span>
        <span><kbd>Space</kbd> Hard drop</span>
      </div>
    </div>
  </div>
{/if}

{#if $state.resumeCountdown > 0 && (!$state.showViewportGuard || $state.bypassViewportGuard)}
  <div class="overlay resume">
    <div class="onboard-card">
      <h2>Resuming</h2>
      <div class="countdown">{$state.resumeCountdown}</div>
      <p>Press <kbd>P</kbd> or <kbd>Esc</kbd> to cancel.</p>
    </div>
  </div>
{/if}

{#if $state.ui.status === 'paused'
  && $state.resumeCountdown === 0
  && !$state.showControls
  && !$state.showSettings
  && !$state.leaderboardOpen
  && (!$state.showViewportGuard || $state.bypassViewportGuard)}
  <div class="overlay">
    <div class="onboard-card">
      <h2>Paused</h2>
      {#if helpers.isCompetitiveMode($derived.currentMode)}
        <p>Resuming disabled in competitive modes.</p>
        <p>Press <kbd>R</kbd> or click Restart to try again.</p>
        <button class="primary" on:click={actions.restartGame} disabled={!helpers.canRestart($state.ui.status)}>
          Restart
        </button>
      {:else}
        <p>Press <kbd>P</kbd> or <kbd>Esc</kbd> to resume.</p>
        <button class="primary" on:click={actions.togglePause}>Resume</button>
      {/if}
    </div>
  </div>
{/if}

{#if $state.ui.status === 'results' && (!$state.showViewportGuard || $state.bypassViewportGuard)}
  <div class="overlay results">
    <div class="onboard-card results-card">
      <p class="onboard-tag">{$derived.currentMode.label} results</p>
      <h2>Session complete</h2>
      {#if $state.ui.modeEndReason}
        <p class="result-reason">{labels.endReasonLabel($state.ui.modeEndReason)}</p>
      {/if}
      <div class="results-grid">
        {#if $derived.currentMode.id === 'zen'}
          <div>
            <span class="result-label">Session time</span>
            <strong>{format.formatClock($derived.resultSummary.timeMs)}</strong>
          </div>
          <div>
            <span class="result-label">Pieces placed</span>
            <strong>{$derived.resultSummary.pieces}</strong>
          </div>
        {:else if $derived.currentMode.id === 'sprint40'}
          <div>
            <span class="result-label">Final time</span>
            <strong>{format.formatClock($derived.resultSummary.timeMs, true)}</strong>
          </div>
          <div>
            <span class="result-label">Lines per minute</span>
            <strong>{format.formatRate($derived.resultSummary.lpm)}</strong>
          </div>
        {:else}
          <div>
            <span class="result-label">Score</span>
            <strong>{$derived.resultSummary.score}</strong>
          </div>
          <div>
            <span class="result-label">PPS</span>
            <strong>{format.formatRate($derived.resultSummary.pps)}</strong>
          </div>
          <div>
            <span class="result-label">Lines</span>
            <strong>{$derived.resultSummary.lines}</strong>
          </div>
        {/if}
      </div>
      {#if $derived.currentMode.metric}
        {#if $derived.hasNickname && $derived.mineTopEntry}
          <div class="best-card">
            <span class="result-label">My best</span>
            <strong>{format.formatMetricValue($derived.mineTopEntry.metricValue, $derived.currentMode)}</strong>
          </div>
        {:else if !$derived.hasNickname}
          <div class="best-card muted">
            <span class="result-label">Set a nickname</span>
            <strong>Scores go live once you save it</strong>
          </div>
        {/if}
      {/if}
      {#if $derived.currentMode.metric && $derived.globalRankLabel !== '—'}
        <div class="best-card">
          <span class="result-label">Global rank</span>
          <strong>{$derived.globalRankLabel}</strong>
        </div>
        {#if $derived.hasNickname && $derived.mineRankLabel !== '—'}
          <div class="best-card">
            <span class="result-label">My rank</span>
            <strong>{$derived.mineRankLabel}</strong>
          </div>
        {/if}
      {/if}
      {#if $derived.currentMode.metric}
        <div class={`submit-card ${$state.submitStatus}`}>
          <span class="result-label">Leaderboard</span>
          {#if $state.ui.modeEndReason === 'quit' || $state.ui.modeEndReason === 'topout'}
            <strong>Not submitted</strong>
            <small>{$state.ui.modeEndReason === 'topout' ? 'Topped out' : 'Run ended early'}</small>
          {:else if $state.submitStatus === 'pending'}
            <strong>Submitting...</strong>
          {:else if $state.submitStatus === 'success'}
            <strong>Submitted ✓</strong>
          {:else if $state.submitStatus === 'error'}
            <strong>Submit failed</strong>
            <button class="ghost small" on:click={actions.retrySubmit}>Retry</button>
          {:else if $state.submitStatus === 'offline'}
            <strong>Offline</strong>
          {:else}
            <strong>Ready</strong>
          {/if}
          {#if $state.submitError && $state.submitStatus === 'error'}
            <small>{$state.submitError}</small>
          {/if}
        </div>
      {/if}
      <div class="onboard-actions">
        <button class="primary" on:click={actions.restartGame} disabled={!helpers.canRestart($state.ui.status)}>
          Play again
        </button>
        <button class="ghost" on:click={actions.returnToMenu}>Change mode</button>
      </div>
    </div>
  </div>
{/if}

{#if $state.ui.status === 'gameover' && (!$state.showViewportGuard || $state.bypassViewportGuard)}
  <div class="overlay">
    <div class="onboard-card">
      <h2>Game over</h2>
      <p>Press <kbd>R</kbd> or click Restart to try again.</p>
      <button class="ghost danger" on:click={actions.restartGame} disabled={!helpers.canRestart($state.ui.status)}>
        Restart
      </button>
    </div>
  </div>
{/if}
