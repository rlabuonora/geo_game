import { buildCountrySearchIndex, filterCountrySearch, normalizeCountrySearch } from "../app/web/src/game/countrySearch";
import { getAllCountryCodes, getCountryName } from "../app/web/src/game/countryNames";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const searchIndex = buildCountrySearchIndex(
  getAllCountryCodes().map((isoCode) => {
    const nameEs = getCountryName(isoCode, "es");

    return {
      iso: isoCode,
      nameEs,
      norm: normalizeCountrySearch(nameEs)
    };
  })
);

function findIsos(query: string) {
  return filterCountrySearch(searchIndex, query).map((item) => item.iso);
}

function main() {
  assert(searchIndex.length >= 150, `Country search index looks too small: ${searchIndex.length}`);
  assert(findIsos("costa").includes("CRI"), "Searching 'costa' should find Costa Rica (CRI).");
  assert(findIsos("peru").includes("PER"), "Searching 'peru' should find Peru (PER).");
  assert(findIsos("repu").includes("DOM"), "Searching 'repu' should find Republica Dominicana (DOM).");

  for (const isoCode of ["FRA", "URY", "CHL", "IDN"]) {
    assert(
      searchIndex.some((item) => item.iso === isoCode),
      `Expected ${isoCode} to exist in the search index.`
    );
  }

  console.log(`Country search validation passed for ${searchIndex.length} indexed countries.`);
}

try {
  main();
} catch (error) {
  console.error("Country search validation failed.");
  console.error(error);
  process.exitCode = 1;
}
