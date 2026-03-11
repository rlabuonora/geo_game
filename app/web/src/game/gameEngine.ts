import { type CountryFeature } from "./mapData";

export const DEFAULT_PLAYERS = ["Rafa", "Feli"] as const;
export const MAX_SHOTS_PER_PLAYER = 5;
export const TOTAL_TURNS = DEFAULT_PLAYERS.length * MAX_SHOTS_PER_PLAYER;

export type GamePhase = "playing" | "complete";
export type PlayingPhase = "awaiting_guess" | "showing_result";
export type GuessStatus = "correct" | "incorrect" | null;

export type PlayerState = {
  name: string;
  score: number;
  shotsTaken: number;
};

export type GameState = {
  phase: GamePhase;
  playingPhase: PlayingPhase;
  players: PlayerState[];
  activePlayerIndex: number;
  maxShotsPerPlayer: number;
  targetIso: string | null;
  remainingTargetIsos: string[];
  currentTurnNumber: number;
  correctTargetIsos: string[];
  lastGuessStatus: GuessStatus;
  lastClickedIso: string | null;
  statusNonce: number;
};

export type GameAction =
  | { type: "RESTART_GAME" }
  | { type: "SUBMIT_GUESS"; iso: string }
  | { type: "NEXT_TURN" };

const NON_SOVEREIGN_TARGET_CODES = new Set([
  "ABW",
  "AIA",
  "ALD",
  "ASM",
  "ATA",
  "ATC",
  "ATF",
  "BLM",
  "BMU",
  "COK",
  "CUW",
  "CYM",
  "CYN",
  "FLK",
  "FRO",
  "GGY",
  "GRL",
  "GUM",
  "HKG",
  "HMD",
  "IMN",
  "IOA",
  "IOT",
  "JEY",
  "KAS",
  "MAC",
  "MAF",
  "MNP",
  "MSR",
  "NCL",
  "NFK",
  "NIU",
  "PCN",
  "PRI",
  "PYF",
  "SAH",
  "SGS",
  "SHN",
  "SOL",
  "SPM",
  "SXM",
  "TCA",
  "VGB",
  "VIR",
  "WLF"
]);

function isPlayableCountry(country: CountryFeature) {
  const isoCode = country.properties.isoA3;

  return /^[A-Z]{3}$/.test(isoCode) && !NON_SOVEREIGN_TARGET_CODES.has(isoCode);
}

function shuffleCountries(countries: CountryFeature[]) {
  const shuffled = [...countries];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function buildMatchQueue(countries: CountryFeature[]) {
  return shuffleCountries(countries)
    .filter(isPlayableCountry)
    .slice(0, TOTAL_TURNS)
    .map((country) => country.properties.isoA3);
}

function createPlayers(): PlayerState[] {
  return DEFAULT_PLAYERS.map((name) => ({
    name,
    score: 0,
    shotsTaken: 0
  }));
}

function createStartedGameState(countries: CountryFeature[], statusNonce: number): GameState {
  const queue = buildMatchQueue(countries);
  const [targetIso, ...remainingTargetIsos] = queue;

  return {
    phase: targetIso ? "playing" : "complete",
    playingPhase: "awaiting_guess",
    players: createPlayers(),
    activePlayerIndex: 0,
    maxShotsPerPlayer: MAX_SHOTS_PER_PLAYER,
    targetIso: targetIso ?? null,
    remainingTargetIsos,
    currentTurnNumber: 0,
    correctTargetIsos: [],
    lastGuessStatus: null,
    lastClickedIso: null,
    statusNonce
  };
}

function moveToNextTurn(state: GameState) {
  const [nextTargetIso, ...remainingTargetIsos] = state.remainingTargetIsos;

  if (state.currentTurnNumber >= state.players.length * state.maxShotsPerPlayer || !nextTargetIso) {
    return {
      ...state,
      phase: "complete" as const,
      targetIso: null,
      remainingTargetIsos: [],
      playingPhase: "awaiting_guess" as const,
      lastGuessStatus: null,
      lastClickedIso: null,
      statusNonce: state.statusNonce + 1
    };
  }

  return {
    ...state,
    targetIso: nextTargetIso,
    remainingTargetIsos,
    activePlayerIndex: state.currentTurnNumber % state.players.length,
    playingPhase: "awaiting_guess" as const,
    lastGuessStatus: null,
    lastClickedIso: null,
    statusNonce: state.statusNonce + 1
  };
}

export function createInitialGameState(countries: CountryFeature[]): GameState {
  return createStartedGameState(countries, 0);
}

export function createGameReducer(countries: CountryFeature[]) {
  return function reducer(state: GameState, action: GameAction): GameState {
    if (action.type === "RESTART_GAME") {
      return createStartedGameState(countries, state.statusNonce + 1);
    }

    if (action.type === "NEXT_TURN") {
      if (state.phase !== "playing" || state.playingPhase !== "showing_result") {
        return state;
      }

      return moveToNextTurn(state);
    }

    if (action.type === "SUBMIT_GUESS") {
      if (state.phase !== "playing" || state.playingPhase !== "awaiting_guess" || !state.targetIso) {
        return state;
      }

      const isCorrect = action.iso === state.targetIso;
      const players = state.players.map((player, index) =>
        index === state.activePlayerIndex
          ? {
              ...player,
              score: player.score + (isCorrect ? 1 : 0),
              shotsTaken: player.shotsTaken + 1
            }
          : player
      );

      return {
        ...state,
        players,
        currentTurnNumber: state.currentTurnNumber + 1,
        correctTargetIsos: isCorrect ? [...state.correctTargetIsos, state.targetIso] : state.correctTargetIsos,
        playingPhase: "showing_result",
        lastGuessStatus: isCorrect ? "correct" : "incorrect",
        lastClickedIso: action.iso,
        statusNonce: state.statusNonce + 1
      };
    }

    return state;
  };
}
