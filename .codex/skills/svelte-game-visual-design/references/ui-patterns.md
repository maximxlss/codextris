# UI Patterns for Svelte Games

Keep UI clear and secondary to the game canvas. Prefer a small, consistent system of tokens and reusable components.

## Visual system tokens

Define a tight token set and reuse it everywhere.

```css
:root {
  --bg: #0b0f14;
  --bg-accent: #111a24;
  --fg: #e9f0f7;
  --muted: #93a3b5;
  --primary: #4ee3a3;
  --accent: #ffb454;
  --danger: #ff6b6b;

  --radius-sm: 8px;
  --radius-md: 14px;

  --space-1: 6px;
  --space-2: 10px;
  --space-3: 16px;
  --space-4: 24px;

  --shadow-soft: 0 10px 30px rgba(0, 0, 0, 0.35);
}
```

## Layout patterns

- Use a canvas-first column with a compact HUD row above or below.
- For wide screens, add a right-side stats panel; keep it within 280-340px.
- Keep top-level layout to a max width (e.g., 1100-1280px) and center it.

Example layout shell:

```svelte
<div class="shell">
  <header class="hud">...</header>
  <main class="stage">
    <section class="board">...</section>
    <aside class="panel">...</aside>
  </main>
</div>
```

```css
.shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);
}

.stage {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
}

@media (max-width: 900px) {
  .stage {
    grid-template-columns: 1fr;
  }
}
```

## HUD patterns

- Use grouped pills for score, lines, level, and speed.
- Keep numbers right-aligned and use a monospace or tabular font.
- Use subtle separators to avoid visual noise.

```css
.hud {
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
}

.hud-value {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}
```

## Typography patterns

- Use a display face for titles and a readable UI face for labels.
- Prefer tabular numerals for score counters.
- Keep label size smaller but high contrast.

## Button patterns

- Use one primary action button and one secondary outline style.
- Use 44px minimum tap height on mobile.

```css
.btn {
  border-radius: var(--radius-md);
  padding: 12px 18px;
  border: 1px solid transparent;
  font-weight: 600;
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
```
