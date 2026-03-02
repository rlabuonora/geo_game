import cameraOverrides from "../data/camera-overrides.json";
import { type CountryFeature } from "./mapData";

type CameraOverride = {
  marginRatio?: number;
  maxZoom?: number;
};

type CameraOverrideMap = Record<string, CameraOverride>;

export type CameraFrame = {
  bbox: [number, number, number, number];
  bounds: [[number, number], [number, number]];
  padding: [number, number];
  maxZoom: number;
};

const overrides = cameraOverrides as CameraOverrideMap;
const defaultMarginRatio = 0.32;
const defaultMaxZoom = 4.9;
const defaultPadding: [number, number] = [48, 48];

function expandBbox(
  bbox: [number, number, number, number],
  marginRatio: number
): [number, number, number, number] {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const width = Math.max(maxLng - minLng, 1.5);
  const height = Math.max(maxLat - minLat, 1.5);
  const lngPadding = width * marginRatio;
  const latPadding = height * marginRatio;

  return [
    minLng - lngPadding,
    minLat - latPadding,
    maxLng + lngPadding,
    maxLat + latPadding
  ];
}

function collectCoordinates(feature: CountryFeature) {
  if (feature.geometry.type === "Polygon") {
    return feature.geometry.coordinates.flat();
  }

  return feature.geometry.coordinates.flat(2);
}

export function computeCameraForCountry(feature: CountryFeature, iso: string): CameraFrame {
  const coordinates = collectCoordinates(feature);
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  const baseBbox: [number, number, number, number] = [minLng, minLat, maxLng, maxLat];
  const override = overrides[iso] ?? {};
  const bbox = expandBbox(baseBbox, override.marginRatio ?? defaultMarginRatio);

  return {
    bbox,
    bounds: [
      [bbox[1], bbox[0]],
      [bbox[3], bbox[2]]
    ],
    padding: defaultPadding,
    maxZoom: override.maxZoom ?? defaultMaxZoom
  };
}
