import uruguay from "../data/uruguay-departments.geojson.json";
import argentina from "../data/argentina-divisions.geojson.json";
import brazil from "../data/brazil-divisions.geojson.json";
import usa from "../data/usa-divisions.geojson.json";
import { type CountryFeature } from "./mapData";

export const administrativeDatasets = {
  uruguay: uruguay.features as CountryFeature[],
  argentina: argentina.features as CountryFeature[],
  brazil: brazil.features as CountryFeature[],
  usa: usa.features as CountryFeature[]
};
export type AdministrativeCountry = keyof typeof administrativeDatasets;
export const administrativeCountries = Object.keys(administrativeDatasets) as AdministrativeCountry[];
export const administrativeRegions = new Map(
  Object.values(administrativeDatasets).flat().map(region => [region.properties.isoA3, region])
);
