import { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { WorldMap } from "./components/WorldMap";
import { getDevHarnessState } from "./game/devHarness";
import { getCountryName } from "./game/countryNames";
import {
  createGameReducer,
  createInitialGameState,
  type PlayerState
} from "./game/gameEngine";
import { countryPolygons } from "./game/mapData";

import { administrativeDatasets, administrativeCountries, type AdministrativeCountry } from "./game/administrativeData";

const datasets = {
  world: countryPolygons,
  ...administrativeDatasets
};
type GameMode = keyof typeof datasets;

function getMatchResult(players: PlayerState[]) {
  const [firstPlayer, secondPlayer] = players;

  if (!firstPlayer || !secondPlayer) {
    return {
      winner: null,
      scoreLine: ""
    };
  }

  if (firstPlayer.score === secondPlayer.score) {
    return {
      winner: null,
      scoreLine: `${firstPlayer.name} ${firstPlayer.score} — ${secondPlayer.name} ${secondPlayer.score}`
    };
  }

  const winner = firstPlayer.score > secondPlayer.score ? firstPlayer : secondPlayer;

  return {
    winner,
    scoreLine: `${firstPlayer.name} ${firstPlayer.score} — ${secondPlayer.name} ${secondPlayer.score}`
  };
}

export default function App() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<GameMode | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<AdministrativeCountry>("uruguay");
  const harness = getDevHarnessState();
  if (mode || harness) {
    return <Game key={mode ?? "world"} mode={mode ?? "world"} onMenu={() => setMode(null)} />;
  }
  return (
    <main className="app-shell mode-menu">
      <section className="atlas-panel mode-menu-panel">
        <p className="eyebrow-text">{t("app.brand")}</p>
        <h1>{t("menu.title")}</h1>
        <p className="support-text">{t("menu.intro")}</p>
        <div className="mode-options">
          <section className="mode-option">
            <h2>{t("menu.world")}</h2>
            <p className="support-text">{t("menu.worldDescription")}</p>
            <button className="primary-button" onClick={() => setMode("world")}>{t("menu.world")}</button>
          </section>
          <section className="mode-option">
            <h2>{t("menu.divisions")}</h2>
            <p className="support-text">{t("menu.divisionsDescription")}</p>
            <label htmlFor="division-country">{t("menu.country")}</label>
            <select id="division-country" value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value as AdministrativeCountry)}>
              {administrativeCountries.map((country) => <option key={country} value={country}>{t(`menu.${country}`)}</option>)}
            </select>
            <button className="primary-button" onClick={() => setMode(selectedCountry)}>{t("menu.start")}</button>
          </section>
        </div>
      </section>
    </main>
  );
}

function Game({ mode, onMenu }: { mode: GameMode; onMenu: () => void }) {
  const polygons = datasets[mode];
  const reducer = createGameReducer(polygons);
  const { i18n, t } = useTranslation();
  const [gameState, dispatch] = useReducer(reducer, polygons, createInitialGameState);
  const devHarness = getDevHarnessState();
  const currentLanguage = i18n.language === "en" ? "en" : "es";

  const phase = devHarness?.phase ?? gameState.phase;
  const playingPhase = devHarness?.playingPhase ?? gameState.playingPhase;
  const targetIso = devHarness?.targetIso ?? gameState.targetIso;
  const players = devHarness?.players ?? gameState.players;
  const activePlayerIndex = devHarness?.activePlayerIndex ?? gameState.activePlayerIndex;
  const maxShotsPerPlayer = devHarness?.maxShotsPerPlayer ?? gameState.maxShotsPerPlayer;
  const currentTurnNumber = devHarness?.currentTurnNumber ?? gameState.currentTurnNumber;
  const correctTargetIsos = devHarness?.correctTargetIsos ?? gameState.correctTargetIsos;
  const lastGuessStatus = devHarness?.lastGuessStatus ?? gameState.lastGuessStatus;
  const lastClickedIso = devHarness?.lastClickedIso ?? gameState.lastClickedIso;
  const targetCountryName = targetIso
    ? getCountryName(targetIso, currentLanguage)
    : t("flow.noCountry");
  const lastClickedCountryName = lastClickedIso
    ? getCountryName(lastClickedIso, currentLanguage)
    : null;
  const resultCountryName = lastClickedCountryName ?? targetCountryName;
  const { winner, scoreLine } = getMatchResult(players);
  const [playerOne, playerTwo] = players;

  const handleCountryClick = (isoCode: string) => {
    if (devHarness != null || playingPhase !== "awaiting_guess") {
      return;
    }

    dispatch({ type: "SUBMIT_GUESS", iso: isoCode });
  };

  const handleNextTurn = () => {
    if (devHarness != null) {
      return;
    }

    dispatch({ type: "NEXT_TURN" });
  };

  const handleRestart = () => {
    if (devHarness != null) {
      return;
    }

    dispatch({ type: "RESTART_GAME" });
  };

  if (phase === "playing") {
    return (
      <main className="app-shell">
        <section className="expedition-stage">
          <header className={`play-grid play-grid-${playingPhase}`} aria-live="polite">
            <section className={`score-card ${activePlayerIndex === 0 ? "score-card-active" : ""}`}>
              <p className="eyebrow-text">{playerOne?.name}</p>
              <p className="score-card-score">{t("score.points", { score: playerOne?.score ?? 0 })}</p>
              <p className="support-text score-card-attempts">
                {t("score.attempts", { used: playerOne?.shotsTaken ?? 0, total: maxShotsPerPlayer })}
              </p>
            </section>
            <section className="display-card">
              {playingPhase === "awaiting_guess" ? (
                <>
                  <p className="eyebrow-text">{t("turn.promptLabel")}</p>
                  <h1 className="expedition-country-name">{targetCountryName}</h1>
                  <div className="display-card-result-row" aria-hidden="true" />
                </>
              ) : (
                <>
                  <p className="eyebrow-text">
                    {lastGuessStatus === "correct" ? t("turn.correctTitle") : t("turn.incorrectTitle")}
                  </p>
                  <h1 className="display-card-title">
                    {lastGuessStatus === "correct" ? t("turn.correctTitle") : t("turn.incorrectTitle")}
                  </h1>
                  <div className="display-card-result-row">
                    <p className="support-text display-card-body">
                      {t("turn.resultBody", { country: resultCountryName })}
                    </p>
                    <button
                      type="button"
                      className="next-turn-icon"
                      onClick={handleNextTurn}
                      aria-label={t("turn.nextAria")}
                      title={t("turn.next")}
                    >
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </>
              )}
            </section>
            <section className={`score-card ${activePlayerIndex === 1 ? "score-card-active" : ""}`}>
              <p className="eyebrow-text">{playerTwo?.name}</p>
              <p className="score-card-score">{t("score.points", { score: playerTwo?.score ?? 0 })}</p>
              <p className="support-text score-card-attempts">
                {t("score.attempts", { used: playerTwo?.shotsTaken ?? 0, total: maxShotsPerPlayer })}
              </p>
            </section>
          </header>
          <section className="atlas-map-frame expedition-map-frame">
            <WorldMap
              countries={polygons}
              regionalMap={mode !== "world"}
              onMenu={onMenu}
              correctCountryCodes={playingPhase === "showing_result" && lastGuessStatus === "correct" && targetIso ? [targetIso] : []}
              revealedCountryCode={playingPhase === "showing_result" && lastGuessStatus === "incorrect" ? targetIso : null}
              flashCountryCode={playingPhase === "showing_result" && lastGuessStatus === "incorrect" ? lastClickedIso : null}
              screen={phase}
              showCountryNames={playingPhase === "showing_result"}
              onCountryClick={handleCountryClick}
            />
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="atlas-shell">
        <div className="atlas-page atlas-page-complete">
          <section className="atlas-map-column">
            <div className="atlas-map-frame">
              <WorldMap
                countries={polygons}
                regionalMap={mode !== "world"}
                onMenu={onMenu}
                correctCountryCodes={correctTargetIsos}
                flashCountryCode={null}
                screen={phase}
                onCountryClick={handleCountryClick}
              />
            </div>
          </section>
          <aside className="atlas-sidebar">
            <div className="atlas-panel complete-card">
              <p className="eyebrow-text">{t("result.completeLabel")}</p>
              <h1>{t("result.completeTitle")}</h1>
              <p className="support-text result-winner">
                {winner ? t("result.winner", { player: winner.name }) : t("result.tie")}
              </p>
              <p className="support-text result-scoreline">{scoreLine}</p>
              <button type="button" className="primary-button" onClick={handleRestart}>
                {t("flow.playAgain")}
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
