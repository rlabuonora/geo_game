import countryNames from "../data/country-names.json";
import countryCatalog from "../data/country-catalog.json";

type SupportedLanguage = "es" | "en";

type CountryNameMap = Record<
  string,
  {
    es?: string;
    en?: string;
  }
>;

const localizedNames = countryNames as CountryNameMap;
const catalog = countryCatalog as Record<
  string,
  {
    isoA2: string | null;
    name: string;
  }
>;
const displayNamesEs =
  typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["es"], { type: "region" })
    : null;
const displayNamesEn =
  typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function getIntlCountryName(isoA2: string | null, lang: SupportedLanguage) {
  if (!isoA2) {
    return null;
  }

  const formatter = lang === "en" ? displayNamesEn : displayNamesEs;
  const value = formatter?.of(isoA2) ?? null;

  if (!value || value === isoA2) {
    return null;
  }

  return value;
}

export function getAllCountryCodes() {
  return Object.keys(catalog);
}

export function getCountryName(iso: string, lang: SupportedLanguage = "es") {
  const entry = localizedNames[iso];
  const catalogEntry = catalog[iso];

  if (entry?.[lang]) {
    return entry[lang];
  }

  const localizedCatalogName = getIntlCountryName(catalogEntry?.isoA2 ?? null, lang);

  if (localizedCatalogName) {
    return localizedCatalogName;
  }

  if (entry) {
    return entry.es ?? entry.en ?? iso;
  }

  return catalogEntry?.name ?? iso;
}
