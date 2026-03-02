import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type CountryCollection = {
  features: Array<{
    properties: {
      isoA3: string;
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

  const polygonCodes = new Set(
    worldData.features.map((feature) => feature.properties.isoA3)
  );

  const missingKeys = Object.keys(neighbors).filter((code) => !polygonCodes.has(code));
  const missingValues = Object.entries(neighbors).flatMap(([countryCode, codes]) =>
    codes
      .filter((neighborCode) => !polygonCodes.has(neighborCode))
      .map((neighborCode) => `${countryCode} -> ${neighborCode}`)
  );
  if (missingKeys.length > 0 || missingValues.length > 0) {
    console.error("Country data validation failed.");

    if (missingKeys.length > 0) {
      console.error(`Neighbor keys missing polygons: ${missingKeys.join(", ")}`);
    }

    if (missingValues.length > 0) {
      console.error(`Neighbor links missing polygons: ${missingValues.join(", ")}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Country data validation passed for ${Object.keys(neighbors).length} neighbor entries against ${polygonCodes.size} polygon codes.`
  );
}

main().catch((error) => {
  console.error("Country data validation failed with an unexpected error.");
  console.error(error);
  process.exitCode = 1;
});
