# Geo Game (Kids Map Game) — Agent Instructions

## Product goal
Build a fun geography game for kids:
- Random country is selected.
- Players guess neighboring countries.
- The UI is map-first, colorful, and rewarding (animations/confetti).
- Show lots of maps and zoom transitions.

## Tech defaults (unless a task says otherwise)
- Frontend: React + Vite + TypeScript
- Map: MapLibre GL JS
- Data: country polygons (GeoJSON/TopoJSON) + neighbors list (ISO codes)
- No backend required initially; run fully client-side.

## Definition of done (DoD)
Every PR/change must include:
- A clear explanation of what changed
- How to run it locally
- Screenshots or a short gif for any UI change (if feasible)
- If data changes: a small validation script in scripts/ and a sanity check

## Code style
- Prefer simple, readable TypeScript.
- Keep components small.
- Put map/game logic in /app/web/src/game and UI in /app/web/src/components.

## Testing
- Unit tests for pure functions (neighbors checking, scoring).
- Lightweight “smoke test” script for data integrity.

## Safety/UX constraints
- No external tracking.
- Keep UI child-friendly: big buttons, minimal text, forgiving input.

Repository instructions for agents will go here.

## Language / i18n rules (MUST FOLLOW)
- Default UI language is Spanish (`es`).
- No hardcoded user-facing strings in React components, including labels, button text, helper copy, and accessibility text.
- All UI text must come from i18n keys via `t("...")`.
- New strings must be added to `app/web/src/locales/es.json`.
- If English is used, it must live only in `app/web/src/locales/en.json` as a secondary locale.
- Function and variable names can remain English; user-facing text must default to Spanish.
- Before finishing UI work, run `npm run check:ui-strings` and fix any reported violations.
