# Tech Decisions

## Frontend

- React + Vite for a lightweight client-only prototype
- `react-i18next` for UI copy so Spanish can be the default language and English can remain optional
- Leaflet with OpenStreetMap raster tiles for the first real interactive map because it is the smallest dependency change from the current codebase
- No server dependency; all data is imported from local JSON files

## Data

- Country polygons are stored as GeoJSON in the client app for direct Leaflet rendering
- Countries are keyed by ISO alpha-3 codes (`isoA3`)
- Neighbor relationships live in a separate `neighbors.json` map keyed by ISO codes

## Validation

- `scripts/verify-data.ts` ensures every neighbor key exists in polygon data
- It also checks each referenced neighbor code and confirms every polygon has a neighbor entry
