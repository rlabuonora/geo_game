import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Position = [number, number];
type Ring = Position[];
type PolygonGeometry = {
  type: "Polygon";
  coordinates: Ring[];
};
type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: Ring[][];
};
type Feature = {
  type: "Feature";
  properties: {
    isoA3: string;
    name: string;
  };
  geometry: PolygonGeometry | MultiPolygonGeometry;
};
type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetFile = path.resolve(__dirname, "..", "app/web/src/data/world-countries.geojson.json");
const epsilon = 0.05;
const decimals = 3;

function roundCoordinate(value: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function isSamePoint(a: Position, b: Position) {
  return a[0] === b[0] && a[1] === b[1];
}

function quantizeRing(ring: Ring) {
  const quantized: Ring = [];

  for (const [lng, lat] of ring) {
    const point: Position = [roundCoordinate(lng), roundCoordinate(lat)];
    const previous = quantized[quantized.length - 1];

    if (!previous || !isSamePoint(previous, point)) {
      quantized.push(point);
    }
  }

  return quantized;
}

function squaredDistanceToSegment(point: Position, start: Position, end: Position) {
  const [px, py] = point;
  let [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx !== 0 || dy !== 0) {
    const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x1 = x2;
      y1 = y2;
    } else if (t > 0) {
      x1 += dx * t;
      y1 += dy * t;
    }
  }

  const deltaX = px - x1;
  const deltaY = py - y1;
  return deltaX * deltaX + deltaY * deltaY;
}

function simplifyLine(points: Ring, tolerance: number): Ring {
  if (points.length <= 2) {
    return points;
  }

  const lastIndex = points.length - 1;
  const markers = new Array(points.length).fill(false);
  const stack: Array<[number, number]> = [[0, lastIndex]];
  const toleranceSquared = tolerance * tolerance;

  markers[0] = true;
  markers[lastIndex] = true;

  while (stack.length > 0) {
    const [startIndex, endIndex] = stack.pop()!;
    let maxDistance = 0;
    let farthestIndex = -1;

    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = squaredDistanceToSegment(
        points[index],
        points[startIndex],
        points[endIndex]
      );

      if (distance > maxDistance) {
        maxDistance = distance;
        farthestIndex = index;
      }
    }

    if (farthestIndex !== -1 && maxDistance > toleranceSquared) {
      markers[farthestIndex] = true;
      stack.push([startIndex, farthestIndex], [farthestIndex, endIndex]);
    }
  }

  return points.filter((_, index) => markers[index]);
}

function ensureClosedRing(points: Ring) {
  if (points.length === 0) {
    return points;
  }

  const closed = [...points];
  const first = closed[0];
  const last = closed[closed.length - 1];

  if (!isSamePoint(first, last)) {
    closed.push(first);
  }

  return closed;
}

function fallbackTriangle(points: Ring) {
  if (points.length <= 3) {
    return points;
  }

  const step = (points.length - 1) / 2;
  const middle = points[Math.max(1, Math.min(points.length - 2, Math.round(step)))];
  const tail = points[points.length - 1];
  const triangle: Ring = [points[0], middle, tail];

  return triangle.filter(
    (point, index, list) => list.findIndex((entry) => isSamePoint(entry, point)) === index
  );
}

function simplifyRing(ring: Ring) {
  const closedQuantized = quantizeRing(ring);

  if (closedQuantized.length <= 4) {
    return ensureClosedRing(closedQuantized);
  }

  const openRing = [...closedQuantized];

  if (isSamePoint(openRing[0], openRing[openRing.length - 1])) {
    openRing.pop();
  }

  const simplified = simplifyLine(openRing, epsilon);
  const safeRing = simplified.length >= 3 ? simplified : fallbackTriangle(openRing);
  return ensureClosedRing(safeRing);
}

function simplifyGeometry(geometry: PolygonGeometry | MultiPolygonGeometry) {
  if (geometry.type === "Polygon") {
    return {
      type: "Polygon" as const,
      coordinates: geometry.coordinates.map((ring) => simplifyRing(ring))
    };
  }

  return {
    type: "MultiPolygon" as const,
    coordinates: geometry.coordinates.map((polygon) =>
      polygon.map((ring) => simplifyRing(ring))
    )
  };
}

function countPoints(geometry: PolygonGeometry | MultiPolygonGeometry) {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.reduce((sum, ring) => sum + ring.length, 0);
  }

  return geometry.coordinates.reduce(
    (sum, polygon) => sum + polygon.reduce((ringSum, ring) => ringSum + ring.length, 0),
    0
  );
}

async function main() {
  const beforeRaw = await readFile(targetFile, "utf8");
  const before = JSON.parse(beforeRaw) as FeatureCollection;
  const beforePointCount = before.features.reduce(
    (sum, feature) => sum + countPoints(feature.geometry),
    0
  );

  const after: FeatureCollection = {
    type: "FeatureCollection",
    features: before.features.map((feature) => ({
      ...feature,
      geometry: simplifyGeometry(feature.geometry)
    }))
  };

  const afterRaw = JSON.stringify(after);
  const afterPointCount = after.features.reduce(
    (sum, feature) => sum + countPoints(feature.geometry),
    0
  );

  await writeFile(targetFile, `${afterRaw}\n`, "utf8");

  const beforeBytes = Buffer.byteLength(beforeRaw);
  const afterBytes = Buffer.byteLength(afterRaw);
  const byteReduction = beforeBytes - afterBytes;
  const pointReduction = beforePointCount - afterPointCount;

  console.log(
    JSON.stringify(
      {
        beforeBytes,
        afterBytes,
        byteReduction,
        byteReductionPercent: Number(((byteReduction / beforeBytes) * 100).toFixed(2)),
        beforePointCount,
        afterPointCount,
        pointReduction,
        pointReductionPercent: Number(((pointReduction / beforePointCount) * 100).toFixed(2))
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Geo simplification failed.");
  console.error(error);
  process.exitCode = 1;
});
