import { type CountryFeature } from "./mapData";

export type ScreenState = "home" | "playing" | "round_over";
export type GuessStatus = "correct" | "incorrect" | "duplicate" | "target" | "timeout" | null;

export type Player = {
  id: string;
  name: string;
};

export type RoundResult = {
  type: "tie" | "loss";
  loserId: string | null;
} | null;

export type RoundState = {
  targetIso: string;
  neighbors: Set<string>;
  usedNeighbors: Set<string>;
};

export type GameState = {
  screen: ScreenState;
  round: number;
  totalRounds: number;
  players: Player[];
  activePlayerIndex: number;
  roundState: RoundState | null;
  lastGuessStatus: GuessStatus;
  roundResult: RoundResult;
  statusNonce: number;
};

export type GameAction =
  | { type: "START_GAME"; players: Player[] }
  | { type: "START_TURN" }
  | { type: "SUBMIT_GUESS"; iso: string }
  | { type: "NEXT_PLAYER" };

function pickRandomCountry(
  countries: CountryFeature[],
  playableCodes: Set<string>,
  excludeIso?: string | null
) {
  const pool = countries.filter(
    (country) =>
      playableCodes.has(country.properties.isoA3) &&
      country.properties.isoA3 !== excludeIso
  );

  const source =
    pool.length > 0
      ? pool
      : countries.filter((country) => playableCodes.has(country.properties.isoA3));

  return source[Math.floor(Math.random() * source.length)] ?? null;
}

function bumpStatus(state: GameState, status: GuessStatus) {
  return {
    ...state,
    lastGuessStatus: status,
    statusNonce: state.statusNonce + 1
  };
}

function startTurn(state: GameState) {
  if (state.roundState == null) {
    return state;
  }

  return {
    ...state,
    screen: "playing" as const
  };
}

export function createInitialGameState(totalRounds: number): GameState {
  return {
    screen: "home",
    round: 0,
    totalRounds,
    players: [],
    activePlayerIndex: 0,
    roundState: null,
    lastGuessStatus: null,
    roundResult: null,
    statusNonce: 0
  };
}

export function createGameReducer(
  countries: CountryFeature[],
  neighborsByIso: Record<string, string[]>
) {
  const playableCodes = new Set(
    Object.entries(neighborsByIso)
      .filter(([, neighbors]) => neighbors.length > 0)
      .map(([iso]) => iso)
  );

  return function reducer(state: GameState, action: GameAction): GameState {
    if (action.type === "START_GAME") {
      const players = action.players.length >= 2 ? action.players : state.players;
      const nextCountry = pickRandomCountry(
        countries,
        playableCodes,
        state.roundState?.targetIso ?? null
      );

      if (!nextCountry || players.length < 2) {
        return state;
      }

      return {
        ...state,
        screen: "playing",
        round: state.round + 1,
        players,
        activePlayerIndex: 0,
        roundState: {
          targetIso: nextCountry.properties.isoA3,
          neighbors: new Set(neighborsByIso[nextCountry.properties.isoA3] ?? []),
          usedNeighbors: new Set<string>()
        },
        lastGuessStatus: null,
        roundResult: null,
        statusNonce: state.statusNonce + 1
      };
    }

    if (action.type === "START_TURN") {
      if (state.screen !== "playing") {
        return state;
      }

      return {
        ...startTurn(state),
        lastGuessStatus: null,
        statusNonce: state.statusNonce + 1
      };
    }

    if (action.type === "NEXT_PLAYER") {
      if (state.screen !== "playing" || state.roundState == null || state.players.length === 0) {
        return state;
      }

      return {
        ...startTurn({
          ...state,
          activePlayerIndex: (state.activePlayerIndex + 1) % state.players.length
        }),
        lastGuessStatus: null,
        statusNonce: state.statusNonce + 1
      };
    }

    if (action.type === "SUBMIT_GUESS") {
      if (state.screen !== "playing" || state.roundState == null) {
        return state;
      }

      const { roundState } = state;

      if (action.iso === roundState.targetIso) {
        return bumpStatus(state, "target");
      }

      if (!roundState.neighbors.has(action.iso)) {
        return bumpStatus(state, "incorrect");
      }

      if (roundState.usedNeighbors.has(action.iso)) {
        return bumpStatus(state, "duplicate");
      }

      const usedNeighbors = new Set(roundState.usedNeighbors);
      usedNeighbors.add(action.iso);

      if (usedNeighbors.size === roundState.neighbors.size) {
        return {
          ...state,
          screen: "round_over",
          roundState: {
            ...roundState,
            usedNeighbors
          },
          lastGuessStatus: "correct",
          roundResult: {
            type: "tie",
            loserId: null
          },
          statusNonce: state.statusNonce + 1
        };
      }

      return {
        ...startTurn({
          ...state,
          activePlayerIndex: (state.activePlayerIndex + 1) % state.players.length,
          roundState: {
            ...roundState,
            usedNeighbors
          }
        }),
        lastGuessStatus: "correct",
        statusNonce: state.statusNonce + 1
      };
    }

    return state;
  };
}
