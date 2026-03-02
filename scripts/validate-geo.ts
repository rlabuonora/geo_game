import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type CountryCollection = {
  features: Array<{
    properties: {
      isoA3: string;
      name: string;
    };
  }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readJson<T>(filePath: string) {
  const absolutePath = path.resolve(__dirname, "..", filePath);
  const raw = await readFile(absolutePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function main() {
  const worldData = await readJson<CountryCollection>(
    "app/web/src/data/world-countries.geojson.json"
  );
  const neighbors = await readJson<Record<string, string[]>>("data/countries/neighbors.json");

  const isoCounts = new Map<string, number>();

  for (const feature of worldData.features) {
    const isoCode = feature.properties.isoA3;
    isoCounts.set(isoCode, (isoCounts.get(isoCode) ?? 0) + 1);
  }

  const duplicateIsoCodes = [...isoCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([isoCode]) => isoCode);
  const geometryIsoSet = new Set(isoCounts.keys());
  const missingNeighborKeys = Object.keys(neighbors).filter((isoCode) => !geometryIsoSet.has(isoCode));
  const missingNeighborValues = Object.entries(neighbors).flatMap(([sourceIso, neighborCodes]) =>
    neighborCodes
      .filter((neighborIso) => !geometryIsoSet.has(neighborIso))
      .map((neighborIso) => `${sourceIso} -> ${neighborIso}`)
  );
  const expectedSpotChecks = ["FRA", "URY", "CHL", "IDN", "RUS"];
  const missingSpotChecks = expectedSpotChecks.filter((isoCode) => !geometryIsoSet.has(isoCode));

  if (
    duplicateIsoCodes.length > 0 ||
    missingNeighborKeys.length > 0 ||
    missingNeighborValues.length > 0 ||
    missingSpotChecks.length > 0
  ) {
    console.error("Geo dataset validation failed.");

    if (duplicateIsoCodes.length > 0) {
      console.error(`Duplicate country geometries: ${duplicateIsoCodes.join(", ")}`);
    }

    if (missingNeighborKeys.length > 0) {
      console.error(`Neighbor keys missing geometry: ${missingNeighborKeys.join(", ")}`);
    }

    if (missingNeighborValues.length > 0) {
      console.error(`Neighbor links missing geometry: ${missingNeighborValues.join(", ")}`);
    }

    if (missingSpotChecks.length > 0) {
      console.error(`Expected countries missing geometry: ${missingSpotChecks.join(", ")}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log(
    `Geo dataset validation passed for ${geometryIsoSet.size} country geometries and ${Object.keys(neighbors).length} neighbor entries.`
  );
}

main().catch((error) => {
  console.error("Geo dataset validation failed with an unexpected error.");
  console.error(error);
  process.exitCode = 1;
});
