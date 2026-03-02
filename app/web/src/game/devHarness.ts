import { hasCountryPolygon } from "./mapData";
import { type RoundResult, type ScreenState } from "./gameEngine";

type DevHarnessState = {
  screen: ScreenState;
  targetIso: string | null;
  neighborCodes: string[];
  usedNeighborCodes: string[];
  activePlayerName: string | null;
  roundResult: RoundResult;
};

const validScreenParams = new Set(["home", "round", "complete"]);

function parseFoundCodes(value: string | null, neighborCodes: string[]) {
  if (!value) {
    return [];
  }

  const allowedCodes = new Set(neighborCodes);

  return value
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => allowedCodes.has(code));
}

export function getDevHarnessState(
  neighborsByIso: Record<string, string[]>
): DevHarnessState | null {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const screenParam = params.get("screen");

  if (!screenParam || !validScreenParams.has(screenParam)) {
    return null;
  }

  const requestedIso = params.get("country")?.trim().toUpperCase() ?? null;
  const targetIso =
    requestedIso && hasCountryPolygon(requestedIso) ? requestedIso : "FRA";
  const neighborCodes = [...(neighborsByIso[targetIso] ?? [])];
  const foundCodes = parseFoundCodes(params.get("found"), neighborCodes);
  if (screenParam === "home") {
    return {
      screen: "home",
      targetIso: null,
      neighborCodes: [],
      usedNeighborCodes: [],
      activePlayerName: null,
      roundResult: null
    };
  }

  if (screenParam === "round") {
    return {
      screen: "playing",
      targetIso,
      neighborCodes,
      usedNeighborCodes: foundCodes,
      activePlayerName: params.get("player")?.trim() || null,
      roundResult: null
    };
  }

  const usedNeighborCodes = foundCodes.length === 0 ? neighborCodes : foundCodes;

  return {
    screen: "round_over",
    targetIso,
    neighborCodes,
    usedNeighborCodes,
    activePlayerName: params.get("player")?.trim() || null,
    roundResult: {
      type: "tie"
    }
  };
}
