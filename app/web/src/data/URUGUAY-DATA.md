# Uruguay departments

`uruguay-departments.geojson.json` contains 19 first-level administrative divisions, adapted from the simplified geoBoundaries gbOpen URY ADM1 dataset (boundary ID URY-ADM1-27058087, representing 2017). Geometry is preserved; properties are normalized to the game's region identifier (`isoA3`, holding ISO 3166-2 codes), name, and parent country.

Source: geoBoundaries / OpenStreetMap, Wambacher. © OpenStreetMap contributors.
License: Open Data Commons Open Database License 1.0 (ODbL), including this adapted boundary database. https://opendatacommons.org/licenses/odbl/1-0/ ; https://www.openstreetmap.org/copyright

Pinned original download: https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/URY/ADM1/geoBoundaries-URY-ADM1_simplified.geojson
Full upstream provenance is retained in `uruguay-departments-source.json`.

Validate with `npx tsx scripts/validate-departments.ts`. Run locally with `npm run dev`, choose administrative divisions, then Uruguay. To add another country, add its normalized boundary file, source/license metadata and validation, register it in the App datasets, add translated country/menu labels and region names, and expose it in the country selector. Regions use `parentIso` to participate in the existing match queue without sovereign-country filtering.
