<script lang="ts">
  import type { GameModeDefinition } from '$lib/game/modes';
  import type { GameEndReason } from '$lib/game/types';
  import type { LeaderboardEntry } from '$lib/game/leaderboard';
  import './StageOverlays.css';
  import type { UiState } from '$lib/ui/types';
  import type { HandlingPresetId } from '$lib/ui/handlingPresets';

  export let ui: UiState;
  export let showViewportGuard = false;
  export let bypassViewportGuard = false;
  export let onBypassViewportGuard: () => void;

  export let selectedMode: GameModeDefinition;
  export let selectedPreset: HandlingPresetId;
  export let presetName: (id: HandlingPresetId) => string;
  export let nicknameDraft = '';
  export let hasNickname = false;
  export let mineTopEntry: LeaderboardEntry | null = null;
  export let formatMetricValue: (value: number | null, mode: GameModeDefinition) => string;
  export let startGame: () => void;
  export let saveNickname: () => void;

  export let resumeCountdown = 0;
  export let showControls = false;
  export let showSettings = false;
  export let leaderboardOpen = false;

  export let currentMode: GameModeDefinition;
  export let isCompetitiveMode: (mode: GameModeDefinition) => boolean;
  export let togglePause: () => void;
  export let restartGame: () => void;
  export let canRestart: (status: UiState['status']) => boolean;
  export let returnToMenu: () => void;

  export let endReasonLabel: (reason: GameEndReason | null) => string;
  export let resultTimeMs = 0;
  export let resultPieces = 0;
  export let resultLpm = 0;
  export let resultPps = 0;
  export let resultScore = 0;
  export let resultLines = 0;
  export let submitStatus: 'idle' | 'pending' | 'success' | 'error' | 'offline' = 'idle';
  export let submitError: string | null = null;
  export let retrySubmit: () => void;
  export let globalRankLabel = '—';
  export let mineRankLabel = '—';
  export let formatClock: (ms: number, showMs?: boolean) => string;
  export let formatRate: (value: number) => string;
</script>

{#if showViewportGuard && !bypassViewportGuard}
  <div class="overlay guard">
    <div class="onboard-card">
      <h2>Screen too small</h2>
      <p>This layout needs more space to stay readable. Try a wider window or landscape orientation.</p>
      <button class="primary" on:click={onBypassViewportGuard}>Continue anyway</button>
    </div>
  </div>
{/if}

{#if ui.status === 'menu' && (!showViewportGuard || bypassViewportGuard)}
  <div class="overlay ready">
    <div class="onboard-card">
      <p class="onboard-tag">Choose a mode</p>
      <h2>Ready?</h2>
      <p class="intro-guide">
        Pick a mode, tune handling, set a nickname, and chase the leaderboards. Everything you need is on the right.
      </p>
      <div class="selected-mode">
        <span>Selected mode</span>
        <strong>{selectedMode.label}</strong>
      </div>
      <p class="mode-hint">
        Handling preset: <strong>{presetName(selectedPreset)}</strong>
      </p>
      <div class="nickname-card compact">
        <div class="nickname-header">
          <span>Nickname</span>
          {#if hasNickname}
            <span class="nickname-pill">Saved</span>
          {/if}
        </div>
        <div class="nickname-row">
          <input
            type="text"
            placeholder="Set your name"
            bind:value={nicknameDraft}
            on:keydown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                saveNickname();
              }
            }}
          />
          <button class="ghost small" on:click={saveNickname}>Save</button>
        </div>
        <p class="nickname-hint">Set a nickname to appear on leaderboards.</p>
      </div>
      {#if selectedMode.metric}
        {#if hasNickname && mineTopEntry}
          <div class="best-card">
            <span class="result-label">My best</span>
            <strong>{formatMetricValue(mineTopEntry.metricValue, selectedMode)}</strong>
          </div>
        {/if}
      {/if}
      <div class="onboard-actions">
        <button class="primary" on:click={startGame}>Start</button>
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

{#if resumeCountdown > 0 && (!showViewportGuard || bypassViewportGuard)}
  <div class="overlay resume">
    <div class="onboard-card">
      <h2>Resuming</h2>
      <div class="countdown">{resumeCountdown}</div>
      <p>Press <kbd>P</kbd> or <kbd>Esc</kbd> to cancel.</p>
    </div>
  </div>
{/if}

{#if ui.status === 'paused'
  && resumeCountdown === 0
  && !showControls
  && !showSettings
  && !leaderboardOpen
  && (!showViewportGuard || bypassViewportGuard)}
  <div class="overlay">
    <div class="onboard-card">
      <h2>Paused</h2>
      {#if isCompetitiveMode(currentMode)}
        <p>Resuming disabled in competitive modes.</p>
        <p>Press <kbd>R</kbd> or click Restart to try again.</p>
        <button class="primary" on:click={restartGame} disabled={!canRestart(ui.status)}>
          Restart
        </button>
      {:else}
        <p>Press <kbd>P</kbd> or <kbd>Esc</kbd> to resume.</p>
        <button class="primary" on:click={togglePause}>Resume</button>
      {/if}
    </div>
  </div>
{/if}

{#if ui.status === 'results' && (!showViewportGuard || bypassViewportGuard)}
  <div class="overlay results">
    <div class="onboard-card results-card">
      <p class="onboard-tag">{currentMode.label} results</p>
      <h2>Session complete</h2>
      {#if ui.modeEndReason}
        <p class="result-reason">{endReasonLabel(ui.modeEndReason)}</p>
      {/if}
      <div class="results-grid">
        {#if currentMode.id === 'zen'}
          <div>
            <span class="result-label">Session time</span>
            <strong>{formatClock(resultTimeMs)}</strong>
          </div>
          <div>
            <span class="result-label">Pieces placed</span>
            <strong>{resultPieces}</strong>
          </div>
        {:else if currentMode.id === 'sprint40'}
          <div>
            <span class="result-label">Final time</span>
            <strong>{formatClock(resultTimeMs, true)}</strong>
          </div>
          <div>
            <span class="result-label">Lines per minute</span>
            <strong>{formatRate(resultLpm)}</strong>
          </div>
        {:else}
          <div>
            <span class="result-label">Score</span>
            <strong>{resultScore}</strong>
          </div>
          <div>
            <span class="result-label">PPS</span>
            <strong>{formatRate(resultPps)}</strong>
          </div>
          <div>
            <span class="result-label">Lines</span>
            <strong>{resultLines}</strong>
          </div>
        {/if}
      </div>
      {#if currentMode.metric}
        {#if hasNickname && mineTopEntry}
          <div class="best-card">
            <span class="result-label">My best</span>
            <strong>{formatMetricValue(mineTopEntry.metricValue, currentMode)}</strong>
          </div>
        {:else if !hasNickname}
          <div class="best-card muted">
            <span class="result-label">Set a nickname</span>
            <strong>Scores go live once you save it</strong>
          </div>
        {/if}
      {/if}
      {#if currentMode.metric && globalRankLabel !== '—'}
        <div class="best-card">
          <span class="result-label">Global rank</span>
          <strong>{globalRankLabel}</strong>
        </div>
        {#if hasNickname && mineRankLabel !== '—'}
          <div class="best-card">
            <span class="result-label">My rank</span>
            <strong>{mineRankLabel}</strong>
          </div>
        {/if}
      {/if}
      {#if currentMode.metric}
        <div class={`submit-card ${submitStatus}`}>
          <span class="result-label">Leaderboard</span>
          {#if ui.modeEndReason === 'quit'}
            <strong>Not submitted</strong>
            <small>Run ended early</small>
          {:else if submitStatus === 'pending'}
            <strong>Submitting...</strong>
          {:else if submitStatus === 'success'}
            <strong>Submitted ✓</strong>
          {:else if submitStatus === 'error'}
            <strong>Submit failed</strong>
            <button class="ghost small" on:click={retrySubmit}>Retry</button>
          {:else if submitStatus === 'offline'}
            <strong>Offline</strong>
          {:else}
            <strong>Ready</strong>
          {/if}
          {#if submitError && submitStatus === 'error'}
            <small>{submitError}</small>
          {/if}
        </div>
      {/if}
      <div class="onboard-actions">
        <button class="primary" on:click={restartGame} disabled={!canRestart(ui.status)}>
          Play again
        </button>
        <button class="ghost" on:click={returnToMenu}>Change mode</button>
      </div>
    </div>
  </div>
{/if}

{#if ui.status === 'gameover' && (!showViewportGuard || bypassViewportGuard)}
  <div class="overlay">
    <div class="onboard-card">
      <h2>Game over</h2>
      <p>Press <kbd>R</kbd> or click Restart to try again.</p>
      <button class="ghost danger" on:click={restartGame} disabled={!canRestart(ui.status)}>
        Restart
      </button>
    </div>
  </div>
{/if}
