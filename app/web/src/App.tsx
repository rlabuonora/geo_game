import { useReducer } from "react";
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

const reducer = createGameReducer(countryPolygons);

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
  const { i18n, t } = useTranslation();
  const [gameState, dispatch] = useReducer(reducer, countryPolygons, createInitialGameState);
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
          <header className="play-grid" aria-live="polite">
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
                </>
              ) : (
                <>
                  <p className="eyebrow-text">
                    {lastGuessStatus === "correct" ? t("turn.correctTitle") : t("turn.incorrectTitle")}
                  </p>
                  <h1 className="display-card-title">
                    {lastGuessStatus === "correct" ? t("turn.correctTitle") : t("turn.incorrectTitle")}
                  </h1>
                  <p className="support-text display-card-body">
                    {t("turn.resultBody", { country: resultCountryName })}
                  </p>
                  <button type="button" className="primary-button display-card-button" onClick={handleNextTurn}>
                    {t("turn.next")}
                  </button>
                </>
              )}
              <p className="support-text display-card-progress">
                {t("progress.turn", {
                  current: Math.min(currentTurnNumber + (playingPhase === "awaiting_guess" ? 1 : 0), players.length * maxShotsPerPlayer),
                  total: players.length * maxShotsPerPlayer
                })}
              </p>
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
              countries={countryPolygons}
              correctCountryCodes={correctTargetIsos}
              flashCountryCode={playingPhase === "showing_result" && lastGuessStatus === "incorrect" ? lastClickedIso : null}
              screen={phase}
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
                countries={countryPolygons}
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
