<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import type { GameModeDefinition } from '$lib/game/modes';
  import './UiModals.css';
  import type { GameConfig } from '$lib/game/types';
  import type { LeaderboardEntry, LeaderboardScope } from '$lib/game/leaderboard';
  import type { LeaderboardState } from '$lib/game/ui/leaderboardState';
  import type { HandlingPresetId } from '$lib/ui/handlingPresets';

  export let showSettings = false;
  export let showControls = false;
  export let leaderboardOpen = false;

  export let closeModals: () => void;
  export let closeLeaderboardModal: () => void;

  export let settingsCardEl: HTMLDivElement | null = null;
  export let controlsCardEl: HTMLDivElement | null = null;
  export let leaderboardCardEl: HTMLDivElement | null = null;

  export let nicknameDraft = '';
  export let saveNickname: () => void;

  export let presets: ReadonlyArray<{ id: HandlingPresetId; label: string }> = [];
  export let selectedPreset: HandlingPresetId;
  export let CUSTOM_PRESET: HandlingPresetId = 'custom';
  export let applyPreset: (presetId: HandlingPresetId) => void;
  export let handleNumberInput: (key: keyof GameConfig) => (event: Event) => void;
  export let configDraft: GameConfig;

  export let scoringLegend: Record<string, string>;

  export let displayMode: GameModeDefinition;
  export let leaderboardTab: LeaderboardScope = 'global';
  export let activeLeaderboard: LeaderboardState;
  export let activeEntries: LeaderboardEntry[] = [];
  export let hasNickname = false;
  export let formatMetricValue: (value: number | null, mode: GameModeDefinition) => string;
  export let formatClock: (value: number, showMs?: boolean) => string;
  export let formatRate: (value: number) => string;
  export let formatLeaderboardDate: (value: string) => string;
  export let formatLeaderboardDateTime: (value: string) => string;

  let selectedEntryId: string | null = null;
  let selectedEntry: LeaderboardEntry | null = null;
  $: if (selectedEntryId && !activeEntries.some((entry) => entry.id === selectedEntryId)) {
    selectedEntryId = null;
  }
  $: selectedEntry = activeEntries.find((entry) => entry.id === selectedEntryId) ?? null;
  $: if (!leaderboardOpen) {
    selectedEntryId = null;
  }

  const toggleEntrySelection = (entryId: string) => {
    selectedEntryId = selectedEntryId === entryId ? null : entryId;
  };

  const handleOverlayKeydown = (event: KeyboardEvent, close: () => void) => {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

</script>

{#if showSettings}
  <div
    class="overlay modal"
    role="button"
    tabindex="0"
    transition:fade={{ duration: 160 }}
    on:click|self={closeModals}
    on:keydown={(event) => handleOverlayKeydown(event, closeModals)}
  >
    <div
      class="modal-card settings-modal"
      bind:this={settingsCardEl}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      tabindex="-1"
      transition:scale={{ duration: 160, start: 0.97 }}
    >
      <div class="modal-header">
        <h2>Settings</h2>
        <button class="ghost small" on:click={closeModals}>Close</button>
      </div>
      <p class="modal-subtitle">Tune handling and update your nickname.</p>
      <div class="modal-section">
        <h3>Nickname</h3>
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
        <p class="modal-subtitle">Set a nickname to appear on leaderboards.</p>
      </div>
      <div class="modal-section">
        <h3>Handling</h3>
        <p class="modal-subtitle">
          Adjust DAS, ARR, and soft drop timing. Pick a preset or edit the fields directly for custom
          settings.
        </p>
        <div class="preset-row">
          {#each presets as preset (preset.id)}
            <button
              class={`preset-pill ${selectedPreset === preset.id ? 'active' : ''}`}
              on:click={() => applyPreset(preset.id)}
            >
              {preset.label}
            </button>
          {/each}
          <div class={`preset-pill custom ${selectedPreset === CUSTOM_PRESET ? 'active' : ''}`}>
            Custom
          </div>
        </div>
        <div class="handling-grid">
          <div>
            <span class="field-label">
              DAS
              <span class="info" title="Delayed Auto Shift: time before horizontal auto-repeat begins.">ⓘ</span>
            </span>
            <input
              class="value-input"
              type="number"
              min="0"
              max="400"
              step="5"
              value={configDraft.dasMs}
              on:input={handleNumberInput('dasMs')}
            />
          </div>
          <div>
            <span class="field-label">
              ARR
              <span class="info" title="Auto-Repeat Rate: interval between horizontal moves while held.">ⓘ</span>
            </span>
            <input
              class="value-input"
              type="number"
              min="0"
              max="200"
              step="5"
              value={configDraft.arrMs}
              on:input={handleNumberInput('arrMs')}
            />
          </div>
          <div>
            <span class="field-label">
              Soft drop
              <span class="info" title="Soft drop speed multiplier while holding Down.">ⓘ</span>
            </span>
            <input
              class="value-input"
              type="number"
              min="0"
              max="100"
              step="1"
              value={configDraft.softDropFactor}
              on:input={handleNumberInput('softDropFactor')}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if showControls}
  <div
    class="overlay modal"
    role="button"
    tabindex="0"
    transition:fade={{ duration: 160 }}
    on:click|self={closeModals}
    on:keydown={(event) => handleOverlayKeydown(event, closeModals)}
  >
    <div
      class="modal-card"
      bind:this={controlsCardEl}
      role="dialog"
      aria-modal="true"
      aria-label="Controls"
      tabindex="-1"
      transition:scale={{ duration: 160, start: 0.97 }}
    >
      <div class="modal-header">
        <h2>Controls</h2>
        <button class="ghost small" on:click={closeModals}>Close</button>
      </div>
      <ul class="control-list">
        <li>Move: ← →</li>
        <li>Rotate: ↑ or X / Z</li>
        <li>Rotate 180: A</li>
        <li>Soft drop: ↓</li>
        <li>Hard drop: Space</li>
        <li>Hold: C / Shift</li>
        <li>Pause: P / Esc</li>
      </ul>
      <div class="modal-section">
        <h3>Scoring</h3>
        <ul class="control-list scoring-list">
          <li>{scoringLegend.lines}</li>
          <li>{scoringLegend.tspins}</li>
          <li>{scoringLegend.fullClear}</li>
          <li>{scoringLegend.combo}</li>
          <li>{scoringLegend.b2b}</li>
        </ul>
      </div>
    </div>
  </div>
{/if}

{#if leaderboardOpen}
  <div
    class="overlay modal"
    role="button"
    tabindex="0"
    transition:fade={{ duration: 160 }}
    on:click|self={closeLeaderboardModal}
    on:keydown={(event) => handleOverlayKeydown(event, closeLeaderboardModal)}
  >
    <div
      class="modal-card leaderboard-modal"
      bind:this={leaderboardCardEl}
      role="dialog"
      aria-modal="true"
      aria-label="Leaderboards"
      tabindex="-1"
      transition:scale={{ duration: 160, start: 0.97 }}
    >
      <div class="modal-header">
        <h2>{displayMode.label} leaderboards</h2>
        <button class="ghost small" on:click={closeLeaderboardModal}>Close</button>
      </div>
      <div class="leaderboard-tabs">
        <button
          class={`tab ${leaderboardTab === 'global' ? 'active' : ''}`}
          on:click={() => (leaderboardTab = 'global')}
        >
          Global
        </button>
        <button
          class={`tab ${leaderboardTab === 'mine' ? 'active' : ''}`}
          on:click={() => (leaderboardTab = 'mine')}
          disabled={!hasNickname}
        >
          My scores
        </button>
      </div>
      {#if !displayMode.metric}
        <p class="muted">Zen mode does not submit scores. It runs offline without a server.</p>
      {:else if leaderboardTab === 'mine' && !hasNickname}
        <p class="muted">Save a nickname to view your scores.</p>
      {:else if activeLeaderboard.status === 'loading'}
        <p class="muted">Loading leaderboard...</p>
      {:else if activeLeaderboard.status === 'error'}
        <p class="muted">Unable to load leaderboard.</p>
      {:else if activeLeaderboard.status === 'offline'}
        <p class="muted">Leaderboards are offline.</p>
      {:else if activeEntries.length === 0}
        <p class="muted">No scores yet.</p>
      {:else}
        <div class="leaderboard-list">
          {#each activeEntries as entry, index (entry.id)}
            <div
              class={`leaderboard-row ${selectedEntryId === entry.id ? 'selected' : ''}`}
              role="button"
              tabindex="0"
              on:click={() => toggleEntrySelection(entry.id)}
              on:keydown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggleEntrySelection(entry.id);
                }
              }}
            >
              <span class="rank">#{index + 1}</span>
              <span class="name">{entry.playerName}</span>
              <span class="date">{formatLeaderboardDate(entry.createdAt)}</span>
              <span class="value">{formatMetricValue(entry.metricValue, displayMode)}</span>
            </div>
          {/each}
        </div>
        {#if selectedEntry}
          <div class="leaderboard-detail">
            <div class="detail-header">
              <span>Score details</span>
              <button class="ghost small" on:click={() => (selectedEntryId = null)}>Close</button>
            </div>
            <div class="detail-grid">
              <div>
                <span class="detail-label">Player</span>
                <strong>{selectedEntry.playerName}</strong>
              </div>
              <div>
                <span class="detail-label">Date</span>
                <strong>{formatLeaderboardDateTime(selectedEntry.createdAt)}</strong>
              </div>
              <div>
                <span class="detail-label">Score</span>
                <strong>{displayMode.metric === 'time' ? '—' : selectedEntry.score}</strong>
              </div>
              <div>
                <span class="detail-label">Time</span>
                <strong>{formatClock(selectedEntry.timeMs, true)}</strong>
              </div>
              <div>
                <span class="detail-label">Lines</span>
                <strong>{selectedEntry.lines}</strong>
              </div>
              <div>
                <span class="detail-label">Pieces</span>
                <strong>{selectedEntry.pieces}</strong>
              </div>
              <div>
                <span class="detail-label">PPS</span>
                <strong>{formatRate(selectedEntry.pps)}</strong>
              </div>
              <div>
                <span class="detail-label">Seed</span>
                <strong>{selectedEntry.seed ?? '—'}</strong>
              </div>
              <div>
                <span class="detail-label">Version</span>
                <strong>{selectedEntry.clientVersion ?? 'Unknown'}</strong>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
