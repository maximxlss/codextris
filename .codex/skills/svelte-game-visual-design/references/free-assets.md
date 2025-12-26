# Finding Relevant Free Assets

Use this guide to source free, legal assets that match the game's style without slowing down production.

## First-pass search strategy

1. Identify the art direction in 3-5 keywords.
   - Examples: "neon arcade", "retro grid", "minimal sci-fi", "pastel cozy".
2. Decide the asset types needed.
   - UI icons, font, background texture, HUD panel frames, SFX.
3. Search with constraints.
   - Add "free", "CC0", or "public domain" to queries.

## Good free sources (names only)

- OpenGameArt (CC0 and attribution assets)
- Kenney (high-quality CC0 game packs)
- Itch.io asset packs (many free/CC0)
- Google Fonts (UI and title fonts)
- Fontshare (free display and UI fonts)
- Pixabay / Pexels (background textures and photos)

## Selection checklist

- License: prefer CC0; if not, confirm attribution requirements.
- Consistency: ensure the pack includes a matching UI style and not just sprites.
- Readability: icons and numerals must be legible at small sizes.
- Performance: favor SVG or optimized PNG; avoid heavy SVG filters.

## Quick fit test

- Drop candidate icons into the HUD at 16-24px and 32-40px.
- Test in both dark and light backgrounds.
- Check the game canvas still reads as the primary focus.

## Attribution hygiene

- Keep a small `ASSETS.md` or `CREDITS.md` listing source, author, and license.
- If attribution is required, add it to the game’s credits screen or README.
