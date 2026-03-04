import { hasCountryPolygon } from "./mapData";
import { type GuessStatus, type ScreenState } from "./gameEngine";

type DevHarnessState = {
  screen: ScreenState;
  targetIso: string | null;
  completedTargetIsos: string[];
  score: number;
  roundIndex: number;
  totalRounds: number;
  lastGuessStatus: GuessStatus;
  lastClickedIso: string | null;
};

const validScreenParams = new Set(["home", "round", "complete"]);

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
  const totalRounds = Math.max(1, parseCount(params.get("total"), 10));
  const score = Math.min(parseCount(params.get("score"), 0), totalRounds);
  const roundIndex = Math.min(parseCount(params.get("round"), 0), totalRounds);
  const completedTargetIsos = parseIsoCodes(params.get("completed"));

  if (screenParam === "home") {
    return {
      screen: "home",
      targetIso: null,
      completedTargetIsos: [],
      score: 0,
      roundIndex: 0,
      totalRounds,
      lastGuessStatus: null,
      lastClickedIso: null
    };
  }

  if (screenParam === "round") {
    return {
      screen: "playing",
      targetIso,
      completedTargetIsos,
      score,
      roundIndex,
      totalRounds,
      lastGuessStatus: params.get("miss") ? "incorrect" : null,
      lastClickedIso: params.get("miss")?.trim().toUpperCase() ?? null
    };
  }

  return {
    screen: "complete",
    targetIso: null,
    completedTargetIsos,
    score: Math.max(score, roundIndex),
    roundIndex: Math.max(score, roundIndex),
    totalRounds,
    lastGuessStatus: null,
    lastClickedIso: null
  };
}
