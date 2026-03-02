import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import neighborData from "../../../data/countries/neighbors.json";
import { CountryAutocomplete } from "./components/CountryAutocomplete";
import { WorldMap } from "./components/WorldMap";
import { countryPolygons } from "./game/mapData";
import { getAllCountryCodes, getCountryName } from "./game/countryNames";
import {
  buildCountrySearchIndex,
  normalizeCountrySearch
} from "./game/countrySearch";
import { getDevHarnessState } from "./game/devHarness";
import {
  createGameReducer,
  createInitialGameState
} from "./game/gameEngine";

const neighborsByIso = neighborData as Record<string, string[]>;
const reducer = createGameReducer(countryPolygons, neighborsByIso);
const autocompleteCountries = buildCountrySearchIndex(
  getAllCountryCodes().map((isoCode) => {
    const nameEs = getCountryName(isoCode, "es");

    return {
      iso: isoCode,
      nameEs,
      norm: normalizeCountrySearch(nameEs)
    };
  })
);

function buildPlayers(names: string[]) {
  return names.map((name, index) => ({
    id: `player-${index + 1}`,
    name
  }));
}

export default function App() {
  const { i18n, t } = useTranslation();
  const [gameState, dispatch] = useReducer(reducer, createInitialGameState());
  const [homePlayerNames, setHomePlayerNames] = useState<string[]>(["Rafa", "Feli"]);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const devHarness = getDevHarnessState(neighborsByIso);

  const currentLanguage = i18n.language === "en" ? "en" : "es";
  const canStartFromHome = homePlayerNames.length >= 2;
  const screen = devHarness?.screen ?? gameState.screen;
  const activeCountryCode = devHarness?.targetIso ?? gameState.roundState?.targetIso ?? null;
  const activeCountryName = activeCountryCode
    ? getCountryName(activeCountryCode, currentLanguage)
    : t("flow.noCountry");
  const usedNeighborCodes = devHarness?.usedNeighborCodes ?? [
    ...(gameState.roundState?.usedNeighbors ?? new Set<string>())
  ];
  const neighborCodes = devHarness?.neighborCodes ?? [
    ...(gameState.roundState?.neighbors ?? new Set<string>())
  ];
  const activePlayer = gameState.players[gameState.activePlayerIndex] ?? null;
  const activePlayerName = devHarness?.activePlayerName ?? activePlayer?.name ?? null;
  const roundResult = devHarness?.roundResult ?? gameState.roundResult;
  const remainingNeighborNames = neighborCodes
    .filter((isoCode) => !usedNeighborCodes.includes(isoCode))
    .map((isoCode) => getCountryName(isoCode, currentLanguage));
  const foundNeighborNames = usedNeighborCodes.map((isoCode) =>
    getCountryName(isoCode, currentLanguage)
  );
  const tieHasUnplayedNeighbors = roundResult?.type === "tie" && remainingNeighborNames.length > 0;

  useEffect(() => {
    if (import.meta.env.DEV && autocompleteCountries.length < 150) {
      console.warn("[geo-neighbors] autocomplete index looks too small", {
        count: autocompleteCountries.length
      });
    }
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV && screen === "playing") {
      console.info("[geo-neighbors] round state", {
        neighborsTotal: neighborCodes.length,
        usedCount: usedNeighborCodes.length,
        activePlayer: activePlayerName ?? null
      });
    }
  }, [activePlayerName, neighborCodes.length, screen, usedNeighborCodes.length]);

  const commitPlayerName = () => {
    const trimmedName = newPlayerName.trim();

    if (!trimmedName) {
      setIsAddingPlayer(false);
      setNewPlayerName("");
      return;
    }

    setHomePlayerNames((currentNames) => {
      if (
        currentNames.some(
          (existingName) => existingName.toLocaleLowerCase() === trimmedName.toLocaleLowerCase()
        )
      ) {
        return currentNames;
      }

      return [...currentNames, trimmedName];
    });
    setNewPlayerName("");
    setIsAddingPlayer(false);
  };

  const handleStart = () => {
    if (devHarness != null) {
      return;
    }

    const players =
      gameState.players.length >= 2 ? gameState.players : buildPlayers(homePlayerNames);

    if (players.length < 2) {
      return;
    }

    dispatch({ type: "START_GAME", players });
  };

  const handleGuess = (isoCode: string) => {
    if (devHarness != null) {
      return;
    }

    dispatch({ type: "SUBMIT_GUESS", iso: isoCode });
  };

  const handleGiveUp = () => {
    if (devHarness != null) {
      return;
    }

    dispatch({ type: "NEXT_PLAYER" });
  };

  const feedbackMessage =
    gameState.lastGuessStatus === "correct"
      ? t("turn.feedbackCorrect")
      : gameState.lastGuessStatus === "incorrect"
      ? t("turn.feedbackIncorrect")
      : gameState.lastGuessStatus === "duplicate"
        ? t("turn.feedbackDuplicate")
        : gameState.lastGuessStatus === "target"
          ? t("turn.feedbackTarget")
          : null;

  return (
    <main className="app-shell">
      {screen === "playing" ? (
        <section className="playing-layout">
          <aside className="playing-sidebar">
            <div className="playing-card" aria-live="polite">
              <div className="playing-header">
                <p className="eyebrow-text playing-turn-label">{t("turn.activePlayerLabel")}</p>
                <p className="playing-player-name">{activePlayerName ?? t("flow.noPlayer")}</p>
                <div className="playing-country-header">
                  <span className="compass-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M14.8 9.2 13 13l-3.8 1.8L11 11l3.8-1.8Z" />
                    </svg>
                  </span>
                  <h1 className="playing-country-name">{activeCountryName}</h1>
                </div>
              </div>
              <div className="playing-action-cluster">
                <div className="playing-instructions">
                  <p className="support-text">{t("turn.instructionPrimary", { country: activeCountryName })}</p>
                  <p className="support-text subtle-text">{t("turn.instructionSecondary")}</p>
                </div>
                <CountryAutocomplete
                  countries={autocompleteCountries}
                  targetIso={activeCountryCode}
                  onSelectIso={handleGuess}
                  lastGuessStatus={gameState.lastGuessStatus}
                  statusNonce={gameState.statusNonce}
                />
                <button type="button" className="secondary-button" onClick={handleGiveUp}>
                  {t("turn.giveUp")}
                </button>
                {feedbackMessage ? (
                  <p className="feedback-text playing-feedback">{feedbackMessage}</p>
                ) : null}
              </div>
              <div className="playing-status-cluster">
                <div className="playing-progress">
                  <span>{t("progress.found", { found: usedNeighborCodes.length, total: neighborCodes.length })}</span>
                </div>
                {foundNeighborNames.length > 0 ? (
                  <div className="neighbor-chip-list" aria-label={t("progress.aria")}>
                    {foundNeighborNames.map((name) => (
                      <span key={name} className="neighbor-chip">
                        {name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
          <section className="map-stage map-stage-playing">
            <WorldMap
              countries={countryPolygons}
              activeCountryCode={activeCountryCode}
              foundCountryCodes={usedNeighborCodes}
              screen={screen}
              onCountryClick={handleGuess}
            />
          </section>
        </section>
      ) : (
        <section
          className={`atlas-shell${
            screen === "home" || screen === "round_over" ? " atlas-shell-home" : ""
          }`}
        >
          <div
            className={`atlas-page${
              screen === "home" || screen === "round_over" ? " atlas-page-home" : ""
            }`}
          >
            <aside className="atlas-sidebar">
              {screen === "home" ? (
                <div className="atlas-panel home-card">
                  <h1>{t("flow.homeTitle")}</h1>
                  <p className="support-text">{t("flow.homeHint")}</p>
                  <div className="home-players-section">
                    <p className="eyebrow-text home-section-label">{t("flow.playersLabel")}</p>
                    <div className="player-chip-list" aria-label={t("flow.playersAria")}>
                      {homePlayerNames.map((playerName) => (
                        <span key={playerName} className="player-chip">
                          <span>{playerName}</span>
                          <button
                            type="button"
                            className="player-chip-remove"
                            onClick={() =>
                              setHomePlayerNames((currentNames) =>
                                currentNames.filter((name) => name !== playerName)
                              )
                            }
                            aria-label={t("flow.removePlayer", { player: playerName })}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    {isAddingPlayer ? (
                      <input
                        type="text"
                        className="players-input"
                        value={newPlayerName}
                        onChange={(event) => setNewPlayerName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitPlayerName();
                          }
                        }}
                        onBlur={() => {
                          if (newPlayerName.trim().length === 0) {
                            setIsAddingPlayer(false);
                          }
                        }}
                        placeholder={t("flow.playerDraftPlaceholder")}
                        aria-label={t("flow.playersAria")}
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        className="add-player-button"
                        onClick={() => setIsAddingPlayer(true)}
                      >
                        {t("flow.addPlayer")}
                      </button>
                    )}
                    <p className="support-text subtle-text">{t("flow.playersHelper")}</p>
                  </div>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleStart}
                    disabled={!canStartFromHome}
                  >
                    {t("flow.play")}
                  </button>
                </div>
              ) : (
                <div className="atlas-panel complete-card">
                  <p className="eyebrow-text">{t("result.tieLabel")}</p>
                  <h1>{t("result.tieTitle")}</h1>
                  <p className="support-text">
                    {tieHasUnplayedNeighbors
                      ? t("result.tiePassHint", { country: activeCountryName })
                      : t("result.tieHint", { country: activeCountryName })}
                  </p>
                  {remainingNeighborNames.length > 0 ? (
                    <p className="support-text">
                      {t("result.remainingNeighbors", {
                        countries: remainingNeighborNames.join(", ")
                      })}
                    </p>
                  ) : null}
                  <button type="button" className="primary-button" onClick={handleStart}>
                    {t("flow.nextRound")}
                  </button>
                </div>
              )}
            </aside>
            <section className="atlas-map-column">
              <div className="atlas-map-frame">
                <WorldMap
                  countries={countryPolygons}
                  activeCountryCode={activeCountryCode}
                  foundCountryCodes={usedNeighborCodes}
                  screen={screen}
                  onCountryClick={handleGuess}
                />
              </div>
            </section>
          </div>
        </section>
      )}
    </main>
  );
}
