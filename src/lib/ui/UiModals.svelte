<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import './UiModals.css';
  import { getGamePageContext } from '$lib/ui/game-page';
  import { MAX_NICKNAME_LENGTH } from '$lib/leaderboard/constants';
  import type { LeaderboardEntry } from '$lib/game/leaderboard';
  import { LEADERBOARD_LIMIT } from '$lib/ui/page/constants';

  const { view, actions, elements } = getGamePageContext();
  const state = view.state;
  const derived = view.derived;
  const format = view.format;
  const config = view.config;

  let settingsCardEl: HTMLDivElement | null = null;
  let controlsCardEl: HTMLDivElement | null = null;
  let leaderboardCardEl: HTMLDivElement | null = null;

  $: elements.setSettingsCard(settingsCardEl);
  $: elements.setControlsCard(controlsCardEl);
  $: elements.setLeaderboardCard(leaderboardCardEl);

  const handleNicknameInput = (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    actions.setNicknameDraft(target?.value ?? '');
  };

  let selectedEntryId: string | null = null;
  let selectedEntry: LeaderboardEntry | null = null;
  $: if (selectedEntryId && !$derived.activeEntries.some((entry) => entry.id === selectedEntryId)) {
    selectedEntryId = null;
  }
  $: selectedEntry = $derived.activeEntries.find((entry) => entry.id === selectedEntryId) ?? null;
  $: if (!$state.leaderboardOpen) {
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

  const getNameSizeClass = (name: string) => {
    const length = name.trim().length;
    if (length > 16) return 'name-micro';
    if (length > 12) return 'name-tight';
    return '';
  };
</script>

{#if $state.showViewportGuard && !$state.bypassViewportGuard}
  <div
    class="overlay modal guard"
    role="button"
    tabindex="0"
    transition:fade={{ duration: 160 }}
    on:click|self={actions.onBypassViewportGuard}
    on:keydown={(event) => handleOverlayKeydown(event, actions.onBypassViewportGuard)}
  >
    <div
      class="modal-card settings-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Screen too small"
      tabindex="-1"
      transition:scale={{ duration: 160, start: 0.97 }}
    >
      <h2>Screen too small</h2>
      <p>This layout needs more space to stay readable. Try a wider window or landscape orientation.</p>
      <div class="onboard-actions">
        <button class="primary" on:click={actions.onBypassViewportGuard}>Continue anyway</button>
      </div>
    </div>
  </div>
{/if}


{#if $state.showSettings}
  <div
    class="overlay modal"
    role="button"
    tabindex="0"
    transition:fade={{ duration: 160 }}
    on:click|self={actions.closeModals}
    on:keydown={(event) => handleOverlayKeydown(event, actions.closeModals)}
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
        <button class="ghost small" on:click={actions.closeModals}>Close</button>
      </div>
      <p class="modal-subtitle">Tune handling and update your nickname.</p>
      <div class="modal-section">
        <h3>Nickname</h3>
        <div class="nickname-row">
          <input
            type="text"
            placeholder="Set your name"
            value={$state.nicknameDraft}
            maxlength={MAX_NICKNAME_LENGTH}
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
        <p class="modal-subtitle">Set a nickname to appear on leaderboards.</p>
      </div>
      <div class="modal-section">
        <h3>Handling</h3>
        <p class="modal-subtitle">
          Adjust DAS, ARR, and soft drop timing. Pick a preset or edit the fields directly for custom
          settings.
        </p>
        <div class="preset-row">
          {#each view.presets as preset (preset.id)}
            <button
              class={`preset-pill ${$state.selectedPreset === preset.id ? 'active' : ''}`}
              on:click={() => config.applyPreset(preset.id)}
            >
              {preset.label}
            </button>
          {/each}
          <div
            class={`preset-pill custom ${$state.selectedPreset === view.constants.customPresetId ? 'active' : ''}`}
          >
            Custom
          </div>
        </div>
        <div class="handling-grid">
          <label>
            <span class="field-label">DAS</span>
            <input
              class="value-input"
              type="number"
              min="0"
              step="1"
              value={$state.configDraft.dasMs}
              on:input={config.handleNumberInput('dasMs')}
            />
          </label>
          <label>
            <span class="field-label">ARR</span>
            <input
              class="value-input"
              type="number"
              min="0"
              step="1"
              value={$state.configDraft.arrMs}
              on:input={config.handleNumberInput('arrMs')}
            />
          </label>
          <label>
            <span class="field-label">Soft drop</span>
            <input
              class="value-input"
              type="number"
              min="0"
              step="1"
              value={$state.configDraft.softDropFactor}
              on:input={config.handleNumberInput('softDropFactor')}
            />
          </label>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if $state.showControls}
  <div
    class="overlay modal"
    role="button"
    tabindex="0"
    transition:fade={{ duration: 160 }}
    on:click|self={actions.closeModals}
    on:keydown={(event) => handleOverlayKeydown(event, actions.closeModals)}
  >
    <div
      class="modal-card controls-modal"
      bind:this={controlsCardEl}
      role="dialog"
      aria-modal="true"
      aria-label="Controls"
      tabindex="-1"
      transition:scale={{ duration: 160, start: 0.97 }}
    >
      <div class="modal-header">
        <h2>Controls</h2>
        <button class="ghost small" on:click={actions.closeModals}>Close</button>
      </div>
      <div class="modal-section">
        <h3>Controls</h3>
        <ul class="control-list">
          <li><strong>Move:</strong> <kbd>←</kbd> Left · <kbd>→</kbd> Right · <kbd>↓</kbd> Soft drop</li>
          <li><strong>Rotate:</strong> <kbd>↑</kbd>/<kbd>X</kbd> CW · <kbd>Z</kbd> CCW · <kbd>A</kbd> 180</li>
          <li><strong>Other:</strong> <kbd>Space</kbd> Hard drop · <kbd>C</kbd> Hold</li>
          <li><strong>System:</strong> <kbd>P</kbd>/<kbd>Esc</kbd> Pause · <kbd>R</kbd> Restart</li>
        </ul>
      </div>
      <div class="modal-section">
        <h3>Scoring</h3>
        <ul class="scoring-list">
          {#each Object.entries(view.scoringLegend) as [key, value]}
            <li>
              <span class="score-label">{key}</span>
              <span class="score-value">
                {#each value.split('\\n') as line}
                  <span class="score-line">{line}</span>
                {/each}
              </span>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
{/if}

{#if $state.leaderboardOpen}
  <div
    class="overlay modal"
    role="button"
    tabindex="0"
    transition:fade={{ duration: 160 }}
    on:click|self={actions.closeLeaderboardModal}
    on:keydown={(event) => handleOverlayKeydown(event, actions.closeLeaderboardModal)}
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
        <h2>Leaderboards</h2>
        <button class="ghost small" on:click={actions.closeLeaderboardModal}>Close</button>
      </div>
      {#if $derived.displayMode.metric}
        <div class="leaderboard-tabs">
          <button
            class={`tab ${$state.leaderboardTab === 'global' ? 'active' : ''}`}
            on:click={() => actions.setLeaderboardTab('global')}
          >
            Global
          </button>
          <button
            class={`tab ${$state.leaderboardTab === 'mine' ? 'active' : ''}`}
            on:click={() => actions.setLeaderboardTab('mine')}
          >
            My scores
          </button>
        </div>
        {#if $state.leaderboardTab === 'mine' && !$derived.hasNickname}
          <p class="modal-subtitle">Set a nickname to appear in personal leaderboards.</p>
        {:else}
          <div class="leaderboard-list">
            {#if $derived.activeEntries.length === 0}
              {#if $derived.activeLeaderboard.status === 'loading'}
                <p class="muted">Loading...</p>
              {:else if $derived.activeLeaderboard.status === 'error'}
                <p class="muted">Error loading</p>
              {:else if $derived.activeLeaderboard.status === 'offline'}
                <p class="muted">Offline</p>
              {:else}
                <p class="muted">No scores yet</p>
              {/if}
            {:else}
              {#if $derived.activeLeaderboard.status === 'loading'}
                <p class="muted leaderboard-refresh">Refreshing…</p>
              {/if}
              <p class="muted leaderboard-note">Showing top {LEADERBOARD_LIMIT} entries</p>
              {#each $derived.activeEntries as entry, index (entry.id)}
                <div>
                  <button
                    class={`leaderboard-row ${selectedEntryId === entry.id ? 'selected' : ''}`}
                    on:click={() => toggleEntrySelection(entry.id)}
                  >
                    <span class="rank">#{index + 1}</span>
                    <span class={`name ${getNameSizeClass(entry.playerName)}`} title={entry.playerName}>
                      {entry.playerName}
                    </span>
                    <span class="value">{format.formatMetricValue(entry.metricValue, $derived.displayMode)}</span>
                    <span class="date">{format.formatLeaderboardDate(entry.createdAt)}</span>
                  </button>
                  {#if selectedEntry && selectedEntry.id === entry.id}
                    <div class="leaderboard-detail">
                      <div class="detail-header">
                        <span class="detail-name">{selectedEntry.playerName}</span>
                        <span class="detail-value">
                          {format.formatMetricValue(selectedEntry.metricValue, $derived.displayMode)}
                        </span>
                      </div>
                      <div class="detail-grid">
                        <div>
                          <span class="detail-label">Score</span>
                          <strong>{$derived.displayMode.id === 'sprint40' ? 'N/A' : selectedEntry.score}</strong>
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
                          <strong>{format.formatRate(selectedEntry.pps)}</strong>
                        </div>
                        <div>
                          <span class="detail-label">Time</span>
                          <strong>{format.formatClock(selectedEntry.timeMs, true)}</strong>
                        </div>
                        <div>
                          <span class="detail-label">Submitted</span>
                          <strong>{format.formatLeaderboardDateTime(selectedEntry.createdAt)}</strong>
                        </div>
                        <div>
                          <span class="detail-label">Version</span>
                          <strong>{selectedEntry.clientVersion ?? 'N/A'}</strong>
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
        {/if}
      {:else}
        <p class="modal-subtitle">Leaderboards are disabled for this mode.</p>
      {/if}
    </div>
  </div>
{/if}
