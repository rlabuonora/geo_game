# Visual UI Iteration

Use this loop when making UI changes to the Geo Neighbors app and you need repeatable screenshots for comparison.

## Workflow

1. Start the Vite dev server with `npm run dev`.
2. In a second terminal, run `npm run screenshot`.
3. Open `screenshots/latest/home.png`, `screenshots/latest/round.png`, and `screenshots/latest/complete.png`.
4. List the top 3 visual issues you see across those screenshots.
5. Implement the smallest patch that fixes the highest-impact issue first.
6. Re-run `npm run screenshot`.
7. Compare the new screenshots against the previous run.
8. Repeat until the key issue is resolved.
9. Summarize what changed and list the files touched.

## Screen Modes

The screenshot scripts use a dev-only harness. These URLs are available only in development:

- `/?screen=home`
- `/?screen=round&country=FRA&player=Ana&seconds=7&round=2`
- `/?screen=complete&country=CAN&result=tie&round=2`

Use these query params to force a stable visual state without changing the production game flow.

## Constraints

- Keep changes minimal and reversible.
- Do not refactor unrelated systems during visual iteration.
- Do not hardcode user-facing strings in JSX.
- Spanish (`es`) remains the default UI language.
- Do not add new dependencies unless there is a clear need.

## Validation

- Run `npm run check:ui-strings` after UI text changes.
- Run `npm run build` before closing the iteration.
- If screenshots fail, confirm the dev server is running on `http://localhost:5173` or set `SCREENSHOT_BASE_URL`.
