import { Skia, SkPath } from "@shopify/react-native-skia";

import type { PixelPoint } from "../types";
import { monotoneSegments } from "./monotone-curve";

export type CurveType = "linear" | "smooth";

/**
 * Линия в builder: отрезками или сглаженная монотонной кубической кривой —
 * без петель при неравномерном шаге и без перелёта значений.
 */
const buildLineInBuilder = (
  builder: ReturnType<typeof Skia.PathBuilder.Make>,
  points: PixelPoint[],
  curve: CurveType,
): void => {
  "worklet";

  if (points.length === 0) return;

  builder.moveTo(points[0].x, points[0].y);

  const segments = curve === "smooth" ? monotoneSegments(points) : [];

  if (segments.length > 0) {
    for (const segment of segments) {
      builder.cubicTo(
        segment.c1x,
        segment.c1y,
        segment.c2x,
        segment.c2y,
        segment.x,
        segment.y,
      );
    }

    return;
  }

  for (let index = 1; index < points.length; index++) {
    builder.lineTo(points[index].x, points[index].y);
  }
};

/**
 * Строит линию из точек — линейную (`linear`) или сглаженную (`smooth`,
 * монотонная кубическая).
 */
export const buildLinePathFromPoints = (
  points: PixelPoint[],
  curve: CurveType = "linear",
): SkPath => {
  "worklet";

  const builder = Skia.PathBuilder.Make();

  buildLineInBuilder(builder, points, curve);

  return builder.detach();
};

/**
 * Строит область (area path) — линию, замкнутую на `baselineY`.
 */
export const buildAreaPathFromPoints = (
  points: PixelPoint[],
  curve: CurveType,
  baselineY: number,
): SkPath => {
  "worklet";

  const builder = Skia.PathBuilder.Make();

  buildLineInBuilder(builder, points, curve);

  if (points.length > 0) {
    const lastX = points[points.length - 1].x;

    builder.lineTo(lastX, baselineY);
    builder.lineTo(points[0].x, baselineY);
    builder.close();
  }

  return builder.detach();
};
