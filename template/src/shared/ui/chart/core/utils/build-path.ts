import { Skia, SkPath } from "@shopify/react-native-skia";

import type { PixelPoint } from "../types";

export type CurveType = "linear" | "smooth";

/**
 * Строит линию из точек — линейную (`linear`) или сглаженную (`smooth`) Catmull-Rom.
 */
export const buildLinePathFromPoints = (
  points: PixelPoint[],
  curve: CurveType = "linear",
): SkPath => {
  "worklet";

  const path = Skia.Path.Make();

  if (points.length === 0) {
    return path;
  }

  path.moveTo(points[0].x, points[0].y);

  if (curve === "smooth" && points.length > 2) {
    for (let index = 0; index < points.length - 1; index++) {
      const p0 = points[index === 0 ? 0 : index - 1];
      const p1 = points[index];
      const p2 = points[index + 1];
      const p3 = points[index + 2 < points.length ? index + 2 : index + 1];

      path.cubicTo(
        p1.x + (p2.x - p0.x) / 6,
        p1.y + (p2.y - p0.y) / 6,
        p2.x - (p3.x - p1.x) / 6,
        p2.y - (p3.y - p1.y) / 6,
        p2.x,
        p2.y,
      );
    }
  } else {
    for (let index = 1; index < points.length; index++) {
      path.lineTo(points[index].x, points[index].y);
    }
  }

  return path;
};

/**
 * Строит область (area path) — линию, замкнутую на `baselineY`.
 * Использует `buildLinePathFromPoints` для верхней границы.
 */
export const buildAreaPathFromPoints = (
  points: PixelPoint[],
  curve: CurveType,
  baselineY: number,
): SkPath => {
  "worklet";

  const path = buildLinePathFromPoints(points, curve);

  if (points.length === 0) {
    return path;
  }

  const firstX = points[0].x;
  const lastX = points[points.length - 1].x;

  path.lineTo(lastX, baselineY);
  path.lineTo(firstX, baselineY);
  path.close();

  return path;
};
