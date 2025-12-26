# Playwright MCP UI Audit

Use this to review the UI before and after visual changes.

## Snapshot routine

1. Open the main route and wait for the game to render.
2. Capture an accessibility snapshot for the default state.
3. Trigger key states (pause, game over, settings) and capture snapshots.
4. Resize to mobile and capture one snapshot.
5. Repeat after changes and compare deltas.

## What to check

- Readability: score, level, and buttons have strong contrast.
- Layout: the canvas stays unobstructed; HUD elements align to a grid.
- Spacing: consistent padding and gaps across panels and buttons.
- Motion: transitions are subtle and do not distract from play.
- Performance: avoid heavy shadow blur or large animated areas.

## Playwright MCP reminders

- Use accessibility snapshots for reliable structure checks.
- If a state is not reachable by UI, toggle the Svelte state in the console.
