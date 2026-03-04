import { type CountryFeature } from "./mapData";

export const GAME_ROUNDS = 10;

export type ScreenState = "home" | "playing" | "complete";
export type GuessStatus = "correct" | "incorrect" | null;

export type GameState = {
  screen: ScreenState;
  targetIso: string | null;
  remainingTargetIsos: string[];
  completedTargetIsos: string[];
  score: number;
  roundIndex: number;
  totalRounds: number;
  lastGuessStatus: GuessStatus;
  lastClickedIso: string | null;
  statusNonce: number;
};

export type GameAction =
  | { type: "START_GAME" }
  | { type: "SUBMIT_GUESS"; iso: string }
  | { type: "CLEAR_FEEDBACK" };

function isPlayableCountry(country: CountryFeature) {
  const isoCode = country.properties.isoA3;

  return /^[A-Z]{3}$/.test(isoCode) && isoCode !== "ATA";
}

function shuffleCountries(countries: CountryFeature[]) {
  const shuffled = [...countries];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function buildExpeditionQueue(countries: CountryFeature[]) {
  return shuffleCountries(countries)
    .filter(isPlayableCountry)
    .slice(0, GAME_ROUNDS)
    .map((country) => country.properties.isoA3);
}

function bumpStatus(state: GameState, status: GuessStatus, isoCode: string | null) {
  return {
    ...state,
    lastGuessStatus: status,
    lastClickedIso: isoCode,
    statusNonce: state.statusNonce + 1
  };
}

export function createInitialGameState(): GameState {
  return {
    screen: "home",
    targetIso: null,
    remainingTargetIsos: [],
    completedTargetIsos: [],
    score: 0,
    roundIndex: 0,
    totalRounds: GAME_ROUNDS,
    lastGuessStatus: null,
    lastClickedIso: null,
    statusNonce: 0
  };
}

export function createGameReducer(countries: CountryFeature[]) {
  return function reducer(state: GameState, action: GameAction): GameState {
    if (action.type === "START_GAME") {
      const queue = buildExpeditionQueue(countries);
      const [targetIso, ...remainingTargetIsos] = queue;

      if (!targetIso) {
        return state;
      }

      return {
        screen: "playing",
        targetIso,
        remainingTargetIsos,
        completedTargetIsos: [],
        score: 0,
        roundIndex: 0,
        totalRounds: queue.length,
        lastGuessStatus: null,
        lastClickedIso: null,
        statusNonce: state.statusNonce + 1
      };
    }

    if (action.type === "CLEAR_FEEDBACK") {
      if (state.lastGuessStatus !== "incorrect") {
        return state;
      }

      return {
        ...state,
        lastGuessStatus: null,
        lastClickedIso: null,
        statusNonce: state.statusNonce + 1
      };
    }

    if (action.type === "SUBMIT_GUESS") {
      if (state.screen !== "playing" || !state.targetIso) {
        return state;
      }

      if (action.iso !== state.targetIso) {
        return bumpStatus(state, "incorrect", action.iso);
      }

      const nextScore = state.score + 1;
      const nextRoundIndex = state.roundIndex + 1;
      const completedTargetIsos = [...state.completedTargetIsos, action.iso];
      const [nextTargetIso, ...remainingTargetIsos] = state.remainingTargetIsos;

      if (!nextTargetIso) {
        return {
          ...state,
          screen: "complete",
          targetIso: null,
          remainingTargetIsos: [],
          completedTargetIsos,
          score: nextScore,
          roundIndex: nextRoundIndex,
          lastGuessStatus: "correct",
          lastClickedIso: action.iso,
          statusNonce: state.statusNonce + 1
        };
      }

      return {
        ...state,
        targetIso: nextTargetIso,
        remainingTargetIsos,
        completedTargetIsos,
        score: nextScore,
        roundIndex: nextRoundIndex,
        lastGuessStatus: "correct",
        lastClickedIso: action.iso,
        statusNonce: state.statusNonce + 1
      };
    }

    return state;
  };
}
