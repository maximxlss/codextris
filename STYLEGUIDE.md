# Codextris Visual Style Guide — Sparkline Noir

## Aesthetic summary
Sparkline Noir blends deep-space blacks with electric cyan and ember highlights. The interface stays dark and glassy so the in-game spark trails and block colors remain the brightest elements. UI edges glow softly like energized circuitry, and motion is slow + ambient.

## Palette (UI + accent)
- Background 0: `#070A10`
- Background 1: `#0B1220`
- Background 2: `#121A2E`
- Surface glass: `rgba(10, 16, 28, 0.84)`
- Surface soft: `rgba(12, 18, 32, 0.68)`
- Ink: `#EEF3FF`
- Ink soft: `#9AA6C0`
- Primary glow (cyan): `#5AF2FF`
- Ember accent: `#FFB454`
- Danger: `#FF6B6B`

## Typography
- Display / headers: **Chakra Petch** (techy, compact)
- UI / labels: **Space Grotesk** (clean and readable)
- Numbers: tabular numerals enabled for score and timers

## Layout + spacing
- Stage and side panel sit in a 1.25 / 0.75 grid split (canvas always dominant)
- Max width: 1200px
- Spacing scale: 6px, 10px, 16px, 24px, 32px
- Radius scale: 10px / 16px / 22px / 28px

## Components
### Buttons
- Primary: cyan → ember gradient, soft glow, dark text
- Secondary/ghost: translucent glass, thin border, subtle inner line
- Minimum height: 44px (36px for compact)

### Stats + HUD cards
- Glass surfaces with faint top highlights
- Uppercase labels with wide letter spacing
- Strong numbers with subtle glow

### Overlays + modals
- Dark scrim with blurred backdrop
- Onboard cards use the same glass surface, stronger borders, and subtle glow

### Stage + board
- Stage: darker panel with faint grid, subtle cyan wash
- Board: deep matte black with inner glow to frame the spark trails

## Motion + effects
- Background gradient drift (slow, 18–22s)
- Status pills pulse when live
- Respect `prefers-reduced-motion` to disable motion

## Do / Don’t
- Do keep UI darker than the gameplay area to let sparks stand out
- Do use cyan for live state and ember for warm actions
- Don’t add heavy textures or bright backgrounds behind the board
- Don’t introduce extra neon colors beyond cyan + ember

## Minimal UI Variant (Soft Neon)
Use this variant when simplifying the layout or reducing nested frames.

### Surfaces
- Game surface (board + a thin Hold/Next rail)
- Info surface (stats + actions)

### Layout
- Board is dominant on the left.
- Right panel uses a simple 2x2 stats grid plus a primary action row.

### Tokens
- Background: `#070A12`
- Panel: `rgba(255,255,255,0.04)`
- Stroke: `rgba(255,255,255,0.08)`
- Text: `rgba(255,255,255,0.92)`
- Muted text: `rgba(255,255,255,0.55)`
- Accent: `#4DEBFF` (cyan) or `#7C5CFF` (violet), pick one

### Typography + spacing
- Title: 24-28
- Stat numbers: 28-36
- Labels: 12-13, uppercase with letter spacing
- 8px grid, panel padding 24, gaps 16, radius 16

### Component rules
- One glow in the UI: around the active board only.
- Use a single border style (1px subtle stroke).
- Use one gradient total (either the board glow or the primary button).
