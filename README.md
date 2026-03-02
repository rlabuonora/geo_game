# geo-neighbors

Client-side prototype for a kid-friendly geography game. The current build uses a simple 3-screen flow: home, playing, and game over.

This iteration keeps Leaflet and runs a turn-based neighbor loop where players find neighboring countries by clicking the map or selecting them from a Spanish autocomplete input.

The map is now locked like a storybook scene: players cannot zoom or pan it manually, and only the app moves the camera.

The UI uses `react-i18next`. Spanish (`es`) remains the default language.

This repo also includes a visual UI iteration loop powered by Playwright screenshot scripts.

## Run

```bash
npm install
npx playwright install chromium
npm run check:ui-strings
npm run verify:data
npm run dev
```

Open the local Vite URL shown in the terminal.

The current Vite config uses the default development port: `http://localhost:5173`.

## Test This Iteration

1. Open the app and confirm the home screen shows a full map and one `Jugar` button.
2. Enter at least two player names separated by commas, then click `Jugar`.
3. Confirm a random target country polygon is highlighted in gold and the map animates toward it.
4. Confirm you cannot zoom, scroll-zoom, drag, double-click zoom, or pinch the map manually.
5. Confirm the playing screen shows the active player, the target country, and the neighbor progress.
6. Type into the country input and confirm suggestions filter live by Spanish country name.
7. Confirm the dropdown only appears when the match count is small enough, then click a suggestion or press Enter when only one match remains.
8. Confirm the selected suggestion behaves exactly like a map click: a correct unused neighbor turns green and the turn immediately advances to the next player.
9. Confirm incorrect or duplicate guesses do not end the turn, and the same player can keep trying until they find a correct unused neighbor or click `Paso`.
10. Confirm clicking `Paso` skips to the next player without ending the game immediately.
11. Confirm that if every player passes in sequence, the game ends in a tie and shows the remaining unplayed neighbors.
12. Otherwise continue until all neighbors are found and the app shows the tie screen.
13. Click `Volver a jugar` and confirm a new target country is selected and the map zooms again.

## Scripts

- `npm run dev`: start the React prototype.
- `npm run build`: build the client bundle.
- `npm run preview`: preview the production build.
- `npm run deploy:netlify`: build the app, print Netlify link/init instructions, and optionally run a production deploy when passed `--prod`.
- `npm run check:ui-strings`: fail if obvious hardcoded UI strings remain in TSX files.
- `npm run validate:geo`: validate the geometry dataset, ISO uniqueness, and required country spot checks.
- `npm run validate:search`: validate the canonical autocomplete search index and known search cases.
- `npm run verify:data`: validate that all neighbor codes match the real polygon dataset.
- `npm run screenshot:home`: capture the home screen to `screenshots/latest/home.png`.
- `npm run screenshot:round`: capture the round screen to `screenshots/latest/round.png`.
- `npm run screenshot:complete`: capture the complete screen to `screenshots/latest/complete.png`.
- `npm run screenshot`: run all three screenshot scripts in sequence.

## Screenshots

1. Start the dev server with `npm run dev`.
2. In another terminal, run `npm run screenshot`.
3. Review the generated files in `screenshots/latest/`.

The screenshot scripts use a dev-only harness so each state is stable:

- `/?screen=home`
- `/?screen=round&country=FRA&player=Ana`
- `/?screen=complete&country=CAN&result=tie`

### Troubleshooting

- If screenshot capture fails to load the page, confirm the dev server is running.
- If the app is running on a different port, set `SCREENSHOT_BASE_URL`, for example:

```bash
SCREENSHOT_BASE_URL=http://localhost:4173 npm run screenshot
```

- If Chromium is missing, run `npx playwright install chromium`.

## Deployment

This repo is configured for Netlify with [netlify.toml](/Users/rafa/Desktop/code/geo_game/geo-neighbors/netlify.toml):

- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback: all routes redirect to `/index.html`

### Install Netlify CLI

The project includes `netlify-cli` as a dev dependency. If you need to install it again:

```bash
npm install -D netlify-cli
```

### Link Or Init A Site

To connect this repo to an existing Netlify site:

```bash
npx netlify link
```

To create a new site and link it:

```bash
npx netlify init
```

### Deploy

Build and print the deployment steps:

```bash
npm run deploy:netlify
```

Build and deploy to production in one step (after linking and authenticating):

```bash
npm run deploy:netlify -- --prod
```

You can also use:

```bash
NETLIFY_DEPLOY=1 npm run deploy:netlify
```

### Environment Variables

This app does not currently require runtime environment variables. If that changes:

1. Add the variables in the Netlify site dashboard under Site configuration > Environment variables.
2. Mirror any required local values in a `.env` file for development.
3. Rebuild and redeploy after updating them.

## i18n

- Primary locale file: `app/web/src/locales/es.json`
- Secondary locale file: `app/web/src/locales/en.json`
- Add new user-facing text through translation keys only. Do not hardcode strings in TSX components.
- Run `npm run check:ui-strings` before finishing UI changes.

## Map Data

- Polygon dataset: `app/web/src/data/world-countries.geojson.json`
- Camera overrides: `app/web/src/data/camera-overrides.json`
- Map renderer: Leaflet
- Map data attribution: Natural Earth
- Camera is app-controlled only; user zoom/pan gestures are disabled.
- Add an ISO key to `camera-overrides.json` to tune `marginRatio` or `maxZoom` for edge cases.
- Keep the attribution visible in the UI when changing the map implementation.

## Turn Rules

- Start a game with 2 or more players entered as a comma-separated list.
- A correct, unused neighbor is the only accepted answer that ends the turn.
- Incorrect guesses and already-used neighbors do not end the turn.
- A correct guess ends only the turn: play moves to the next player.
- `Paso` skips the current player. If all players pass in sequence, the game ends in a tie and shows the remaining neighbors.
- The game also ends in a tie when all neighbors are found.

## Structure

- `app/web`: React + Vite client.
- `app/web/src/data/world-countries.geojson.json`: GeoJSON country polygons used by the interactive map.
- `data/countries`: ISO neighbor data used by the quiz logic.
- `scripts/verify-data.ts`: dataset integrity check.
