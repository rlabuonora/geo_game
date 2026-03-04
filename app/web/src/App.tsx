import { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { WorldMap } from "./components/WorldMap";
import { getDevHarnessState } from "./game/devHarness";
import { getCountryName } from "./game/countryNames";
import { GAME_ROUNDS, createGameReducer, createInitialGameState } from "./game/gameEngine";
import { countryPolygons } from "./game/mapData";

const reducer = createGameReducer(countryPolygons);

export default function App() {
  const { i18n, t } = useTranslation();
  const [gameState, dispatch] = useReducer(reducer, createInitialGameState());
  const devHarness = getDevHarnessState();
  const currentLanguage = i18n.language === "en" ? "en" : "es";

  const screen = devHarness?.screen ?? gameState.screen;
  const targetIso = devHarness?.targetIso ?? gameState.targetIso;
  const score = devHarness?.score ?? gameState.score;
  const totalRounds = devHarness?.totalRounds ?? gameState.totalRounds;
  const roundIndex = devHarness?.roundIndex ?? gameState.roundIndex;
  const completedTargetIsos = devHarness?.completedTargetIsos ?? gameState.completedTargetIsos;
  const lastGuessStatus = devHarness?.lastGuessStatus ?? gameState.lastGuessStatus;
  const lastClickedIso = devHarness?.lastClickedIso ?? gameState.lastClickedIso;
  const targetCountryName = targetIso
    ? getCountryName(targetIso, currentLanguage)
    : t("flow.noCountry");

  useEffect(() => {
    if (devHarness != null || lastGuessStatus !== "incorrect" || !lastClickedIso) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: "CLEAR_FEEDBACK" });
    }, 650);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [devHarness, lastClickedIso, lastGuessStatus]);

  const handleStart = () => {
    if (devHarness != null) {
      return;
    }

    dispatch({ type: "START_GAME" });
  };

  const handleCountryClick = (isoCode: string) => {
    if (devHarness != null) {
      return;
    }

    dispatch({ type: "SUBMIT_GUESS", iso: isoCode });
  };

  if (screen === "playing") {
    return (
      <main className="app-shell">
        <section className="expedition-stage">
          <header className="expedition-header-band" aria-live="polite">
            <div className="expedition-header-copy">
              <p className="eyebrow-text">{t("turn.promptLabel")}</p>
              <h1 className="expedition-country-name">{targetCountryName}</h1>
            </div>
            <div className="expedition-progress">
              <p className="support-text">{t("progress.round", { current: roundIndex + 1, total: totalRounds })}</p>
              <p className="support-text expedition-score">{t("progress.score", { score, total: totalRounds })}</p>
              {lastGuessStatus === "incorrect" ? (
                <p className="feedback-text expedition-feedback">{t("turn.feedbackIncorrect")}</p>
              ) : null}
            </div>
          </header>
          <section className="atlas-map-frame expedition-map-frame">
            <WorldMap
              countries={countryPolygons}
              correctCountryCodes={completedTargetIsos}
              flashCountryCode={lastGuessStatus === "incorrect" ? lastClickedIso : null}
              screen={screen}
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
        <div className="atlas-page">
          <aside className="atlas-sidebar">
            {screen === "home" ? (
              <div className="atlas-panel home-card">
                <p className="eyebrow-text">{t("flow.homeLabel")}</p>
                <h1>{t("flow.homeTitle")}</h1>
                <p className="support-text">{t("flow.homeHint")}</p>
                <p className="support-text subtle-text">{t("flow.homeRounds", { total: GAME_ROUNDS })}</p>
                <button type="button" className="primary-button" onClick={handleStart}>
                  {t("flow.play")}
                </button>
              </div>
            ) : (
              <div className="atlas-panel complete-card">
                <p className="eyebrow-text">{t("result.completeLabel")}</p>
                <h1>{t("result.completeTitle")}</h1>
                <p className="support-text">{t("result.score", { score, total: totalRounds })}</p>
                <button type="button" className="primary-button" onClick={handleStart}>
                  {t("flow.playAgain")}
                </button>
              </div>
            )}
          </aside>
          <section className="atlas-map-column">
            <div className="atlas-map-frame">
              <WorldMap
                countries={countryPolygons}
                correctCountryCodes={completedTargetIsos}
                flashCountryCode={null}
                screen={screen}
                onCountryClick={handleCountryClick}
              />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
