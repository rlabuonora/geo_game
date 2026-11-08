# Administrative divisions

The country selector is backed by `game/administrativeData.ts`:

- Uruguay: 19 departments; see `URUGUAY-DATA.md` for geoBoundaries/OpenStreetMap provenance and ODbL license.
- Argentina: 23 provinces and the autonomous city of Buenos Aires (24 targets).
- Brazil: 26 states and the Federal District (27 targets).
- United States: 50 states, including Alaska and Hawaii. Washington, DC and territories are not state targets.

Argentina, Brazil and US boundary geometry and names come from Natural Earth Admin 1, 1:10m, in the public domain. The pinned upstream URL, source SHA-256, license link and transformation details are recorded in `administrative-sources.json`. Coordinates are rounded to five decimal places. Alaska's eastern longitudes are shifted by −360° so its islands do not cause a world-spanning bounding box; their geographic positions are unchanged.

Argentina and Brazil retain local region names. US state names use Natural Earth's Spanish and English names according to the current language. Country/menu labels are in the locale files. The map surrounds each playable country with country-level geography; only the selected country's internal boundaries are selectable.

Run `npm run validate:administrative` for expected ISO subdivision sets, ring/coordinate integrity, localized names, Alaska bounds, alternating turns, scoring, and match completion. Run locally with `npm run dev` or build with `npm run build` and start `npm run preview`.

To add a country, provide normalized GeoJSON (`isoA3` containing the subdivision code, `name`, `parentIso`, optional `nameEs`/`nameEn`), register it in `administrativeData.ts`, add both locale menu labels, provenance, and the expected subdivision set in `scripts/validate-administrative.ts`.
