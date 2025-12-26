# Report

## Date
- 2025-12-26

## Scope
Two rounds of five cleanup/refactor sweeps: first pass on hygiene/docs/utilities, second pass on large-file readability and type/lint fixes. No gameplay or rules changes.

## Sweeps completed (round 1)
1. **Security + environment hygiene**
   - Removed `supabase_creds.txt` (contained raw keys) and added it to `.gitignore`.
   - Clarified Supabase setup docs (and roadmap note) to keep keys in `.env.local` only.
2. **Docs consolidation**
   - Merged the useful guidance from `NEW_STYLEGUIDE.md` into `STYLEGUIDE.md` as a concise "Minimal UI Variant".
   - Removed the redundant `NEW_STYLEGUIDE.md` file.
3. **Shared utilities**
   - Added `src/lib/game/utils/math.ts` with a shared `clamp` helper.
   - Added `src/lib/game/ui/format.ts` for clock/rank/metric formatting.
4. **Main UI refactor (type safety)**
   - Introduced a typed `UiState` and a single `createUiState()` helper in `src/routes/+page.svelte`.
   - Swapped inline formatting helpers for the shared UI formatter module.
5. **Debug page cleanup**
   - Reused `clamp` utility and removed the unsafe `as never` cast in spin config updates.

## Sweeps completed (round 2)
1. **Check fixes + config hardening**
   - Addressed lint/typecheck failures (ESLint Node env import, exact optional property handling, test indexing).
   - Enabled `skipLibCheck` to avoid third-party type noise.
2. **Leaderboard readability**
   - Moved leaderboard state types + rank helper into `src/lib/game/ui/leaderboardState.ts`.
3. **Modal/focus helpers**
   - Moved focus-trap + editable-target helpers into `src/lib/game/ui/modals.ts`.
4. **Game loop readability**
   - Split frame handling into `handleFrameInput`, `stepSimulation`, and `finalizeFrame` in `src/routes/+page.svelte`.
5. **Render + core cleanup**
   - Extracted render color/shape helpers and broke board drawing into focused helpers.
   - Reduced repeated timer/rotation resets in `src/lib/game/core/update.ts`.

## Files added
- `src/lib/game/utils/math.ts`
- `src/lib/game/ui/format.ts`
- `src/lib/game/ui/leaderboardState.ts`
- `src/lib/game/ui/modals.ts`
- `src/lib/game/render/color.ts`
- `src/lib/game/render/shapes.ts`

## Files removed
- `NEW_STYLEGUIDE.md`
- `supabase_creds.txt`

## Files updated
- `.gitignore`
- `SUPABASE.md`
- `STYLEGUIDE.md`
- `ROADMAP.md`
- `svelte.config.js`
- `tsconfig.json`
- `src/lib/game/leaderboard.ts`
- `src/lib/game/core/update.ts`
- `src/lib/game/render/canvas.ts`
- `src/routes/+page.svelte`
- `src/routes/debug/+page.svelte`
- `tests/scoring.test.ts`

## Verification
- `npm test -- --run`
- `npm run lint`
- `npm run typecheck`

## Notes / follow-ups
- If you want more readability work, the next low-risk step is splitting `src/routes/+page.svelte` into smaller UI components (HUD, overlays, leaderboards).

## UI refactor (follow-up)
- Split `src/routes/+page.svelte` UI into focused components:
  - `src/lib/ui/StageOverlays.svelte` (menu/pause/results overlays)
  - `src/lib/ui/SidePanel.svelte` (mode tabs, stats, leaderboard cards)
  - `src/lib/ui/UiModals.svelte` (settings/controls/leaderboard/confirm modals)
  - `src/lib/ui/BackendAlerts.svelte` (alert stack)
- Centralized UI types and handling presets:
  - `src/lib/ui/types.ts` (UiState)
  - `src/lib/ui/handlingPresets.ts` (HANDLING_PRESETS, CUSTOM_PRESET)
- Trimmed `src/routes/+page.svelte` styles to layout + stage only; moved component-specific CSS into each UI component.

## Verification (UI refactor)
- `npm test -- --run`
- `npm run lint`
- `npm run typecheck`

## Round 3 scope (2025-12-26)
Leaderboard load fix, mode switch UX changes, and five additional bug-fix sweeps. No gameplay/rules changes beyond requested mode-switch behavior.

## Pre-sweep fixes
1. **My scores leaderboard load**
   - Split localStorage parsing so malformed config cannot block nickname/session restoration.
   - Deferred initial leaderboard refresh until after stored mode/nickname hydrate; added nickname-change refresh.
2. **Mode switch UX**
   - Removed mode-switch confirmation modal.
   - Mode changes now return to the Ready menu overlay instead of auto-starting a run.

## Sweeps completed (round 3)
1. **Input safety**
   - Blocked gameplay key handling whenever any modal/alert is open (including backend alerts).
2. **Leaderboard request race guard**
   - Added a request ID guard so late leaderboard responses can’t overwrite newer mode data.
3. **Leaderboard state reset on mode change**
   - Clear and reset leaderboard state when the active mode changes to prevent stale entries.
4. **Nickname sync**
   - Reset “My scores” tab when nickname is cleared and refresh leaderboards when a nickname is set.
5. **Mobile guard + UI cleanup**
   - Prevented Start/Restart while the mobile guard is active.
   - Cleared transient clear-banner state when switching modes or returning to menu.

## Files updated (round 3)
- `src/routes/+page.svelte`
- `src/lib/ui/StageOverlays.svelte`
- `src/lib/ui/UiModals.svelte`

## Verification (round 3)
- `npm test -- --run`
- `npm run lint`
- `npm run typecheck`

## Round 4 scope (2025-12-26)
Additional bug-hunting and fixes (state reset, leaderboard guardrails, UI safety).

## Sweeps completed (round 4)
1. **Menu reset correctness**
   - Returning to menu now resets the game state (board/score/timers) to avoid stale runs behind the Ready overlay.
2. **Mode switch consistency**
   - Mode switching reuses the same menu reset path to keep state cleanup consistent.
3. **Banner cleanup**
   - Cleared active line-clear banners on Start/Restart to prevent carry-over into new runs.
4. **Leaderboard modal guardrails**
   - Prevented opening the leaderboard modal when the mode has no leaderboard or when “My scores” is unavailable.
5. **Leaderboard tab sanity**
   - Auto-reset the leaderboard tab to Global when switching to non-competitive (Zen) mode.

## Files updated (round 4)
- `src/routes/+page.svelte`

## Verification (round 4)
- `npm test -- --run`
- `npm run lint`
- `npm run typecheck`

## Round 5 scope (2025-12-26)
Remove unnecessary leaderboard tab reset; refactor large files for readability without behavior changes.

## Changes (round 5)
1. **Leaderboard tab tweak**
   - Removed the forced Global tab reset for non-competitive modes (redundant since cards are disabled).
2. **Large-file refactor: storage + labels**
   - Extracted localStorage helpers into `src/lib/ui/storage.ts`.
   - Extracted UI label helpers into `src/lib/ui/labels.ts`.
   - Simplified `src/routes/+page.svelte` onMount and persistence calls.

## Files added (round 5)
- `src/lib/ui/storage.ts`
- `src/lib/ui/labels.ts`

## Files updated (round 5)
- `src/routes/+page.svelte`

## Verification (round 5)
- `npm test -- --run`
- `npm run lint`
- `npm run typecheck`

## Round 6 scope (2025-12-26)
Finish UI refactor to keep large files under 300–400 lines and remove leftover leaderboard tab forcing. No gameplay or rules changes.

## Changes (round 6)
1. **Leaderboard tab behavior**
   - Removed the forced “My scores” → Global tab switch when nickname is cleared.
2. **Route markup split**
   - Moved route markup into `src/lib/ui/GamePageView.svelte` and kept `src/routes/+page.svelte` as controller/wiring.
3. **Page helper modules**
   - Added focused page helpers for constants, config handling, focus trap, layout, modal actions, controllers, and lifecycle wiring.
4. **Large-file reduction**
   - Compressed and regrouped wiring blocks and reactive calculations; `src/routes/+page.svelte` is now 399 lines.

## Files added (round 6)
- `src/lib/ui/GamePageView.svelte`
- `src/lib/ui/page/constants.ts`
- `src/lib/ui/page/configManager.ts`
- `src/lib/ui/page/focusTrap.ts`
- `src/lib/ui/page/layout.ts`
- `src/lib/ui/page/modals.ts`
- `src/lib/ui/page/controllers.ts`
- `src/lib/ui/page/lifecycle.ts`

## Files updated (round 6)
- `src/routes/+page.svelte`
- `src/lib/ui/page/leaderboards.ts`

## Verification (round 6)
- Not run (structural refactor only).

## Round 7 scope (2025-12-26)
Leaderboard batching, richer leaderboard details, and CI build versioning. No gameplay/rules changes.

## Changes (round 7)
1. **Batched leaderboard loading**
   - Fetch all scores per scope once and split/sort by mode locally before slicing to the display limit.
   - Cached per-mode entries to avoid stale cross-mode lists while switching modes.
2. **Leaderboard details**
   - Added inline date display per leaderboard row.
   - Added a score detail panel on row click (includes date/time, PPS, seed, and client version).
3. **CI version injection**
   - GitHub Pages build now sets `PUBLIC_APP_VERSION` to `<last tag>-<commit hash>`.

## Files updated (round 7)
- `.github/workflows/deploy.yml`
- `src/lib/game/leaderboard.ts`
- `src/lib/game/leaderboardApi.ts`
- `src/lib/game/ui/format.ts`
- `src/lib/ui/UiModals.svelte`
- `src/lib/ui/UiModals.css`
- `src/lib/ui/GamePageView.svelte`
- `src/lib/ui/page/leaderboards.ts`
- `src/lib/ui/page/controllers.ts`
- `src/routes/+page.svelte`

## Verification (round 7)
- `npm run typecheck`

## Round 8 scope (2025-12-26)
Add explicit error detail display to backend/server error modal.

## Changes (round 8)
1. **Backend error detail display**
   - Server error modal now shows an “Error” label and the exact backend error message in a code-styled block for clarity.

## Files updated (round 8)
- `src/lib/ui/BackendAlerts.svelte`

## Verification (round 8)
- Not run (UI copy/style-only change).

## Round 9 scope (2025-12-26)
Ensure backend error modals surface the function `error` field reliably.

## Changes (round 9)
1. **Function error priority**
   - `startLeaderboardSession` and `submitScore` now prefer the function response `error` field even when Supabase also returns an error object.

## Files updated (round 9)
- `src/lib/game/leaderboardApi.ts`

## Verification (round 9)
- Not run (error-handling tweak only).

## Round 10 scope (2025-12-26)
Improve extraction of function error payloads for non-2xx responses.

## Changes (round 10)
1. **Function error parsing**
   - Added robust parsing across Supabase function error context fields to surface the JSON `error` payload.

## Files updated (round 10)
- `src/lib/game/leaderboardApi.ts`

## Verification (round 10)
- Not run (error-handling tweak only).

## Round 11 scope (2025-12-26)
Parse Supabase FunctionsHttpError JSON body for error payloads.

## Changes (round 11)
1. **FunctionsHttpError parsing**
   - Added async parsing of `error.context.json()` to surface `{ error: "..." }` responses.

## Files updated (round 11)
- `src/lib/game/leaderboardApi.ts`

## Verification (round 11)
- Not run (error-handling tweak only).

## Round 12 scope (2025-12-26)
Clarify Zen offline behavior and make backend error alerts non-intrusive.

## Changes (round 12)
1. **Non-intrusive backend alerts**
   - Backend error banner is now a corner popup (no modal overlay) and no longer pauses gameplay.
2. **Zen offline clarification**
   - Added copy indicating Zen runs fully offline in the leaderboards panel and modal.

## Files updated (round 12)
- `src/lib/ui/page/modals.ts`
- `src/lib/ui/BackendAlerts.svelte`
- `src/lib/ui/SidePanel.svelte`
- `src/lib/ui/UiModals.svelte`

## Verification (round 12)
- Not run (UI + UX copy changes only).

## Round 13 scope (2025-12-26)
Add a cancel-session edge function and invoke it when replacing sessions.

## Changes (round 13)
1. **Cancel-session edge function**
   - Added `cancel-session` to delete session rows by nonce without IP/name checks.
2. **Session replacement cleanup**
   - When resetting or replacing sessions, the client now calls `cancel-session` to clear the old nonce.

## Files added (round 13)
- `supabase/functions/cancel-session/index.ts`

## Files updated (round 13)
- `src/lib/game/leaderboardApi.ts`
- `src/lib/ui/page/session.ts`

## Verification (round 13)
- Not run (edge function + session flow change).

## Round 14 scope (2025-12-26)
Cancel sessions before replacement and on page unload using beacon requests.

## Changes (round 14)
1. **Session replacement cancellation**
   - Session manager now queues cancellation and awaits it before requesting a new session.
2. **Unload cancellation**
   - Page lifecycle sends a `cancel-session` beacon on `pagehide`/`beforeunload`.
3. **Beacon helper**
   - Added `cancelLeaderboardSessionBeacon` using `navigator.sendBeacon`.

## Files updated (round 14)
- `src/lib/game/leaderboardApi.ts`
- `src/lib/ui/page/session.ts`
- `src/lib/ui/page/lifecycle.ts`
- `src/routes/+page.svelte`

## Verification (round 14)
- Not run (session flow change only).

## Round 15 scope (2025-12-26)
Prevent rapid restarts from stacking session requests.

## Changes (round 15)
1. **Session request coalescing**
   - Session manager now queues the latest requested mode while a request is in flight and only issues one follow-up request.

## Files updated (round 15)
- `src/lib/ui/page/session.ts`

## Verification (round 15)
- Not run (session flow change only).

## Round 16 scope (2025-12-26)
Gate restart for 1 second after a new session is obtained.

## Changes (round 16)
1. **Restart cooldown**
   - Added a 1s cooldown after session creation and blocked restart actions during that window.
   - Restart buttons now disable until the cooldown elapses.

## Files updated (round 16)
- `src/routes/+page.svelte`
- `src/lib/ui/page/gameFlow.ts`
- `src/lib/ui/GamePageView.svelte`
- `src/lib/ui/StageOverlays.svelte`

## Verification (round 16)
- Not run (UI + flow change only).

## Round 17 scope (2025-12-26)
Block rapid restart presses immediately after a restart attempt.

## Changes (round 17)
1. **Restart press cooldown**
   - Restart now bumps the cooldown immediately on press, preventing rapid re-triggering before a new session arrives.

## Files updated (round 17)
- `src/lib/ui/page/gameFlow.ts`
- `src/routes/+page.svelte`

## Verification (round 17)
- Not run (flow change only).

## Round 18 scope (2025-12-26)
Ensure restart cooldown isn't cleared when session resets.

## Changes (round 18)
1. **Cooldown persistence**
   - Stop resetting the restart cooldown when `sessionInfo` clears; only clear it after it expires.

## Files updated (round 18)
- `src/routes/+page.svelte`

## Verification (round 18)
- Not run (flow change only).

## Round 19 scope (2025-12-26)
Fix beacon cancellation payload to avoid CORS/preflight issues.

## Changes (round 19)
1. **Beacon payload**
   - Send JSON string directly in `sendBeacon` so the request uses a simple content type.

## Files updated (round 19)
- `src/lib/game/leaderboardApi.ts`

## Verification (round 19)
- Not run (beacon tweak only).

## Round 20 scope (2025-12-26)
Invoke cancel-session beacon on visibility change.

## Changes (round 20)
1. **Visibilitychange trigger**
   - Cancel-session beacon now fires when the document becomes hidden (reload/close/tab switch).

## Files updated (round 20)
- `src/lib/ui/page/lifecycle.ts`

## Verification (round 20)
- Not run (lifecycle tweak only).

## Round 21 scope (2025-12-26)
Add debug logging for beacon sends and pause on tab hide.

## Changes (round 21)
1. **Debug logging**
   - Added dev-only console logs when sending cancel-session beacons.
2. **Pause on tab hide**
   - Pause gameplay when the tab becomes hidden.

## Files updated (round 21)
- `src/lib/ui/page/lifecycle.ts`
- `src/routes/+page.svelte`

## Verification (round 21)
- Not run (debug + lifecycle change only).

## Round 22 scope (2025-12-26)
Add always-on debug logging for visibility and beacon cancellation.

## Changes (round 22)
1. **Debug logging**
   - Always log lifecycle init, visibility changes, and beacon send attempts.

## Files updated (round 22)
- `src/lib/ui/page/lifecycle.ts`

## Verification (round 22)
- Not run (debug-only change).

## Round 23 scope (2025-12-26)
10 sweep bug-fix/cleanup/refactor pass across lifecycle/input, modals, game flow, leaderboards, and UI wiring.

## Sweeps completed (round 23)
1. **Lifecycle logging hygiene**
   - Gated lifecycle debug logging to dev-only to avoid production console noise.
2. **Lifecycle unmount guard**
   - Prevented post-unmount leaderboard polling from scheduling after `tick()`.
3. **Enter repeat guard**
   - Ignored repeated Enter keydowns to prevent rapid start/restart loops.
4. **Modal manager cleanup**
   - Centralized pause/reset logic for modals and removed alert dismiss side effects.
5. **Backend alert click safety**
   - Stopped propagation on the alert button to avoid double-dismiss.
6. **Overlay handler dedupe**
   - Reused a single overlay keydown handler across modal overlays.
7. **Game flow reset helper**
   - Consolidated run-state resets to reduce duplicated reset logic.
8. **Leaderboard bucketing**
   - Grouped entries by mode before sorting for cleaner logic.
9. **Focus trap reactive cleanup**
   - Simplified focus-trap updates without redundant branches.
10. **Page helper formatting**
   - Expanded inline helpers for resume/audio/nickname handling into readable blocks.

## Files updated (round 23)
- `src/lib/ui/page/lifecycle.ts`
- `src/lib/ui/page/modals.ts`
- `src/lib/ui/BackendAlerts.svelte`
- `src/lib/ui/UiModals.svelte`
- `src/lib/ui/page/gameFlow.ts`
- `src/lib/ui/page/leaderboards.ts`
- `src/routes/+page.svelte`

## Verification (round 23)
- Not run (refactor/cleanup only).
