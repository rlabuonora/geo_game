import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEventHandler
} from "react";
import { useTranslation } from "react-i18next";
import {
  filterCountrySearch,
  type SearchCountry
} from "../game/countrySearch";
import { type GuessStatus } from "../game/gameEngine";

type CountryAutocompleteProps = {
  countries: SearchCountry[];
  targetIso?: string | null;
  onSelectIso: (iso: string) => void;
  lastGuessStatus: GuessStatus;
  statusNonce: number;
};

const maxVisibleSuggestions = 7;

export function CountryAutocomplete({
  countries,
  targetIso,
  onSelectIso,
  lastGuessStatus,
  statusNonce
}: CountryAutocompleteProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const matches = useMemo(
    () => filterCountrySearch(countries, query, targetIso),
    [countries, query, targetIso]
  );
  const hasQuery = query.trim().length > 0;
  const hasMatches = matches.length > 0;
  const withinVisibleLimit = matches.length <= maxVisibleSuggestions;
  const shouldShowSuggestions = hasQuery && hasMatches && withinVisibleLimit;
  const shouldShowKeepTyping = hasQuery && hasMatches && !withinVisibleLimit;
  const shouldShowNoMatches = query.trim().length >= 2 && matches.length === 0;

  const selectIso = (iso: string) => {
    onSelectIso(iso);
  };

  useEffect(() => {
    if (statusNonce === 0) {
      return;
    }

    if (lastGuessStatus === "correct") {
      setQuery("");
    }

    inputRef.current?.focus();
  }, [lastGuessStatus, statusNonce]);

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter" && matches.length === 1) {
      event.preventDefault();
      selectIso(matches[0].iso);
    }
  };

  return (
    <div className="autocomplete-shell">
      <input
        ref={inputRef}
        type="text"
        className="autocomplete-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("autocomplete.placeholder")}
        aria-label={t("autocomplete.aria")}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {shouldShowSuggestions ? (
        <div className="autocomplete-list" role="listbox" aria-label={t("autocomplete.listAria")}>
          {matches.slice(0, maxVisibleSuggestions).map((match) => (
            <button
              key={match.iso}
              type="button"
              className="autocomplete-item"
              onClick={() => selectIso(match.iso)}
            >
              {match.nameEs}
            </button>
          ))}
        </div>
      ) : null}

      {shouldShowKeepTyping ? (
        <p className="autocomplete-empty">{t("autocomplete.keepTyping")}</p>
      ) : null}

      {shouldShowNoMatches ? (
        <p className="autocomplete-empty">{t("autocomplete.empty")}</p>
      ) : null}
    </div>
  );
}
