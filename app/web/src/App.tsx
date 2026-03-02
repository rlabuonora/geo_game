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
  createInitialGameState,
  type Player
} from "./game/gameEngine";

const totalRounds = 5;
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

function parsePlayers(input: string) {
  const names = input
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  return names.map((name, index) => ({
    id: `player-${index + 1}`,
    name
  }));
}

export default function App() {
  const { i18n, t } = useTranslation();
  const [gameState, dispatch] = useReducer(reducer, createInitialGameState(totalRounds));
  const [playerInput, setPlayerInput] = useState(() => t("flow.playersPlaceholder"));
  const devHarness = getDevHarnessState(neighborsByIso);

  const currentLanguage = i18n.language === "en" ? "en" : "es";
  const parsedPlayers = parsePlayers(playerInput);
  const canStartFromHome = parsedPlayers.length >= 2;
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
  const displayRound = devHarness?.round ?? gameState.round;
  const loserName =
    roundResult?.loserId == null
      ? null
      : devHarness?.activePlayerName ??
        gameState.players.find((player) => player.id === roundResult.loserId)?.name ??
        null;

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

  const handleStart = () => {
    if (devHarness != null) {
      return;
    }

    const players = gameState.players.length >= 2 ? gameState.players : parsedPlayers;

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

  const feedbackMessage =
    gameState.lastGuessStatus === "incorrect"
      ? t("turn.feedbackIncorrect")
      : gameState.lastGuessStatus === "duplicate"
        ? t("turn.feedbackDuplicate")
        : gameState.lastGuessStatus === "target"
          ? t("turn.feedbackTarget")
          : null;

  return (
    <main className="app-shell">
      <section className="map-stage">
        <WorldMap
          countries={countryPolygons}
          activeCountryCode={activeCountryCode}
          foundCountryCodes={usedNeighborCodes}
          screen={screen}
          onCountryClick={handleGuess}
        />

        {screen === "playing" ? (
          <section className="country-title-banner" aria-live="polite">
            <p className="eyebrow-text">{t("turn.activePlayer", { player: activePlayerName ?? t("flow.noPlayer") })}</p>
            <h1>{activeCountryName}</h1>
            {feedbackMessage ? (
              <p className="feedback-text">{feedbackMessage}</p>
            ) : null}
          </section>
        ) : null}

        {screen === "home" ? (
          <section className="center-panel">
            <div className="panel-card home-card">
              <h1>{t("flow.homeTitle")}</h1>
              <p className="support-text">{t("flow.homeHint")}</p>
              <input
                type="text"
                className="players-input"
                value={playerInput}
                onChange={(event) => setPlayerInput(event.target.value)}
                placeholder={t("flow.playersPlaceholder")}
                aria-label={t("flow.playersAria")}
              />
              <button
                type="button"
                className="primary-button"
                onClick={handleStart}
                disabled={!canStartFromHome}
              >
                {t("flow.play")}
              </button>
            </div>
          </section>
        ) : null}

        {screen === "round_over" ? (
          <section className="center-panel">
            <div className="panel-card complete-card">
              <p className="eyebrow-text">
                {roundResult?.type === "tie"
                  ? t("result.tieLabel")
                  : t("result.lossLabel")}
              </p>
              <h1>
                {roundResult?.type === "tie"
                  ? t("result.tieTitle")
                  : t("result.lossTitle")}
              </h1>
              <p className="support-text">
                {roundResult?.type === "tie"
                  ? t("result.tieHint", { country: activeCountryName })
                  : t("result.lossHint", {
                      player: loserName ?? t("flow.noPlayer"),
                      country: activeCountryName
                    })}
              </p>
              <button type="button" className="primary-button" onClick={handleStart}>
                {t("flow.nextRound")}
              </button>
            </div>
          </section>
        ) : null}
      </section>

      {screen === "playing" ? (
        <section className="control-bar">
          <div className="control-player">
            <span>{t("turn.activePlayer", { player: activePlayerName ?? t("flow.noPlayer") })}</span>
          </div>
          <div className="control-autocomplete">
            <CountryAutocomplete
              countries={autocompleteCountries}
              targetIso={activeCountryCode}
              onSelectIso={handleGuess}
              lastGuessStatus={gameState.lastGuessStatus}
              statusNonce={gameState.statusNonce}
            />
          </div>
          <div className="control-progress">
            <span>{t("progress.found", { found: usedNeighborCodes.length, total: neighborCodes.length })}</span>
            <strong>{t("progress.round", { round: displayRound, total: gameState.totalRounds })}</strong>
          </div>
        </section>
      ) : null}
    </main>
  );
}
