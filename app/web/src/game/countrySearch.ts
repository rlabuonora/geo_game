export type SearchCountry = {
  iso: string;
  nameEs: string;
  norm: string;
};

export function normalizeCountrySearch(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function buildCountrySearchIndex(countries: SearchCountry[]) {
  return countries.map((country) => ({
    ...country,
    norm: country.norm || normalizeCountrySearch(country.nameEs)
  }));
}

export function filterCountrySearch(
  index: SearchCountry[],
  query: string,
  excludeIso?: string | null
) {
  const normalizedQuery = normalizeCountrySearch(query);

  if (normalizedQuery.length === 0) {
    return [];
  }

  const filtered = index.filter(
    (item) =>
      item.iso !== excludeIso &&
      item.norm.includes(normalizedQuery)
  );

  const prefixMatches = filtered.filter((item) =>
    item.norm.startsWith(normalizedQuery)
  );
  const substringMatches = filtered.filter(
    (item) => !item.norm.startsWith(normalizedQuery)
  );

  return [...prefixMatches, ...substringMatches];
}
