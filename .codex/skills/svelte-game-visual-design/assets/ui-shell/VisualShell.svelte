<script lang="ts">
  export let title = "TETRAI";
  export let subtitle = "Arcade Tactics";
  export let showPanel = true;
</script>

<div class="backdrop scanlines">
  <div class="shell">
    <header class="hud">
      <div class="brand">
        <div class="title">{title}</div>
        <div class="subtitle">{subtitle}</div>
      </div>
      <div class="hud-group">
        <slot name="hud">
          <div class="hud-item">
            <div class="hud-label">Score</div>
            <div class="hud-value">00000</div>
          </div>
          <div class="hud-item">
            <div class="hud-label">Level</div>
            <div class="hud-value">01</div>
          </div>
          <div class="hud-item">
            <div class="hud-label">Lines</div>
            <div class="hud-value">000</div>
          </div>
        </slot>
      </div>
    </header>

    <main class="stage">
      <section class="board glow">
        <slot name="board">
          <div class="placeholder">Canvas</div>
        </slot>
      </section>

      {#if showPanel}
        <aside class="panel">
          <slot name="panel">
            <div class="panel-title">Next</div>
            <div class="panel-box"></div>
            <div class="panel-title">Hold</div>
            <div class="panel-box"></div>
            <div class="panel-actions">
              <button class="btn btn-primary">Start</button>
              <button class="btn btn-ghost">Pause</button>
            </div>
          </slot>
        </aside>
      {/if}
    </main>
  </div>
</div>

<style>
  :global(:root) {
    --bg: #0b0f14;
    --bg-accent: #111a24;
    --fg: #e9f0f7;
    --muted: #93a3b5;
    --primary: #4ee3a3;
    --accent: #ffb454;

    --radius-sm: 8px;
    --radius-md: 14px;

    --space-1: 6px;
    --space-2: 10px;
    --space-3: 16px;
    --space-4: 24px;

    --shadow-soft: 0 10px 30px rgba(0, 0, 0, 0.35);
  }

  .backdrop {
    min-height: 100vh;
    background:
      radial-gradient(1200px 600px at 20% 10%, #16324a, transparent),
      radial-gradient(800px 500px at 80% 20%, #2b1f4f, transparent),
      var(--bg);
    color: var(--fg);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    animation: drift 16s ease-in-out infinite alternate;
  }

  .shell {
    width: min(1200px, 100%);
  }

  .hud {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
    flex-wrap: wrap;
  }

  .brand {
    display: grid;
    gap: 4px;
  }

  .title {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .subtitle {
    font-size: 12px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .hud-group {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .hud-item {
    background: var(--bg-accent);
    color: var(--fg);
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-2);
    box-shadow: var(--shadow-soft);
    min-width: 96px;
  }

  .hud-label {
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .hud-value {
    font-variant-numeric: tabular-nums;
    font-size: 18px;
    letter-spacing: 0.5px;
  }

  .stage {
    display: grid;
    gap: var(--space-4);
    grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
  }

  .board {
    background: #070b10;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-soft);
    padding: var(--space-3);
    min-height: 520px;
    display: grid;
    place-items: center;
  }

  .placeholder {
    color: var(--muted);
    font-size: 14px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .panel {
    background: var(--bg-accent);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    box-shadow: var(--shadow-soft);
    display: grid;
    gap: var(--space-3);
    align-content: start;
  }

  .panel-title {
    font-size: 12px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .panel-box {
    height: 120px;
    border-radius: var(--radius-sm);
    background: #0a121a;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .panel-actions {
    display: grid;
    gap: var(--space-2);
  }

  .btn {
    border-radius: var(--radius-md);
    padding: 12px 18px;
    border: 1px solid transparent;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
  }

  .btn-primary {
    background: var(--primary);
    color: #0b0f14;
  }

  .btn-ghost {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.2);
    color: var(--fg);
  }

  .glow {
    box-shadow: 0 0 24px rgba(78, 227, 163, 0.35);
    animation: glow-pulse 2.4s ease-in-out infinite;
  }

  .scanlines::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.04),
      rgba(255, 255, 255, 0.04) 1px,
      transparent 1px,
      transparent 3px
    );
    mix-blend-mode: soft-light;
  }

  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 18px rgba(78, 227, 163, 0.25); }
    50% { box-shadow: 0 0 30px rgba(78, 227, 163, 0.6); }
  }

  @keyframes drift {
    0% { background-position: 0% 0%, 100% 0%, 0 0; }
    100% { background-position: 10% 10%, 90% 15%, 0 0; }
  }

  @media (max-width: 900px) {
    .stage {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .glow,
    .backdrop {
      animation: none;
    }
  }
</style>
