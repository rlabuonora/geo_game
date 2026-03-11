import { hasCountryPolygon } from "./mapData";
import {
  DEFAULT_PLAYERS,
  MAX_SHOTS_PER_PLAYER,
  type GamePhase,
  type GuessStatus,
  type PlayingPhase,
  type PlayerState
} from "./gameEngine";

type DevHarnessState = {
  phase: GamePhase;
  playingPhase: PlayingPhase;
  targetIso: string | null;
  players: PlayerState[];
  activePlayerIndex: number;
  maxShotsPerPlayer: number;
  currentTurnNumber: number;
  correctTargetIsos: string[];
  lastGuessStatus: GuessStatus;
  lastClickedIso: string | null;
};

const validScreenParams = new Set(["round", "complete"]);

function parseIsoCodes(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => hasCountryPolygon(code));
}

function parseCount(value: string | null, fallbackValue: number) {
  const parsedValue = Number.parseInt(value ?? "", 10);

  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallbackValue;
}

function createPlayers(scoreA: number, scoreB: number, shotsA: number, shotsB: number): PlayerState[] {
  return DEFAULT_PLAYERS.map((name, index) => ({
    name,
    score: index === 0 ? scoreA : scoreB,
    shotsTaken: index === 0 ? shotsA : shotsB
  }));
}

export function getDevHarnessState(): DevHarnessState | null {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const screenParam = params.get("screen");

  if (!screenParam || !validScreenParams.has(screenParam)) {
    return null;
  }

  const requestedIso = params.get("country")?.trim().toUpperCase() ?? null;
  const targetIso = requestedIso && hasCountryPolygon(requestedIso) ? requestedIso : "FRA";
  const clickedIso = params.get("clicked")?.trim().toUpperCase() ?? params.get("miss")?.trim().toUpperCase() ?? null;
  const scoreA = Math.min(parseCount(params.get("scoreA"), 0), MAX_SHOTS_PER_PLAYER);
  const scoreB = Math.min(parseCount(params.get("scoreB"), 0), MAX_SHOTS_PER_PLAYER);
  const shotsA = Math.min(parseCount(params.get("shotsA"), scoreA), MAX_SHOTS_PER_PLAYER);
  const shotsB = Math.min(parseCount(params.get("shotsB"), scoreB), MAX_SHOTS_PER_PLAYER);
  const activePlayerIndex = Math.min(parseCount(params.get("active"), 0), DEFAULT_PLAYERS.length - 1);
  const currentTurnNumber = Math.min(shotsA + shotsB, DEFAULT_PLAYERS.length * MAX_SHOTS_PER_PLAYER);
  const correctTargetIsos = parseIsoCodes(params.get("completed"));
  const players = createPlayers(scoreA, scoreB, shotsA, shotsB);
  const resultParam = params.get("result");
  const lastGuessStatus: GuessStatus =
    resultParam === "correct" ? "correct" : resultParam === "incorrect" || params.get("miss") ? "incorrect" : null;

  if (screenParam === "round") {
    return {
      phase: "playing",
      playingPhase: lastGuessStatus ? "showing_result" : "awaiting_guess",
      targetIso,
      players,
      activePlayerIndex,
      maxShotsPerPlayer: MAX_SHOTS_PER_PLAYER,
      currentTurnNumber,
      correctTargetIsos,
      lastGuessStatus,
      lastClickedIso: clickedIso
    };
  }

  return {
    phase: "complete",
    playingPhase: "awaiting_guess",
    targetIso: null,
    players,
    activePlayerIndex: 0,
    maxShotsPerPlayer: MAX_SHOTS_PER_PLAYER,
    currentTurnNumber: DEFAULT_PLAYERS.length * MAX_SHOTS_PER_PLAYER,
    correctTargetIsos,
    lastGuessStatus: null,
    lastClickedIso: null
  };
}
