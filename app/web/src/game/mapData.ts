import worldPolygons from "../data/world-countries.geojson.json";

export type CountryFeature = {
  type: "Feature";
  properties: {
    isoA3: string;
    name: string;
  };
  geometry:
    | {
        type: "Polygon";
        coordinates: number[][][];
      }
    | {
        type: "MultiPolygon";
        coordinates: number[][][][];
      };
};

type CountryCollection = {
  type: "FeatureCollection";
  features: CountryFeature[];
};

const polygonCollection = worldPolygons as CountryCollection;
const countryByIso = new Map<string, CountryFeature>();
const duplicateIsoCodes = new Set<string>();

for (const feature of polygonCollection.features) {
  const isoCode = feature.properties.isoA3;

  if (countryByIso.has(isoCode)) {
    duplicateIsoCodes.add(isoCode);
    continue;
  }

  countryByIso.set(isoCode, feature);
}

if (duplicateIsoCodes.size > 0) {
  throw new Error(
    `Duplicate country geometries found for ISO codes: ${[...duplicateIsoCodes].join(", ")}`
  );
}

const polygonCodeSet = new Set(countryByIso.keys());

export const countryPolygons = polygonCollection.features;

export function getCountryByIso(isoCode: string) {
  return countryByIso.get(isoCode);
}

export function hasCountryPolygon(isoCode: string) {
  return polygonCodeSet.has(isoCode);
}

export function assertCountryPolygonExists(isoCode: string) {
  if (!hasCountryPolygon(isoCode)) {
    throw new Error(`Missing polygon for ISO code: ${isoCode}`);
  }
}

export function getCountryByIsoOrThrow(isoCode: string) {
  const feature = getCountryByIso(isoCode);

  if (!feature) {
    throw new Error(`Missing country geometry for ISO code: ${isoCode}`);
  }

  return feature;
}
