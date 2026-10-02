import {
  clampRange,
  panRange,
  ViewLimits,
  ViewRange,
} from "../core/viewport/viewport-math";

/** Что тянет палец в навигаторе: край рамки, саму рамку или точку вне её. */
export type NavigatorDragMode = "left" | "right" | "move" | "jump";

/**
 * Режим по точке касания: у края рамки (в пределах `handleHit`, px) — край;
 * внутри — перенос; снаружи — прыжок рамки в точку.
 */
export const resolveNavigatorDrag = (
  x: number,
  windowLeft: number,
  windowRight: number,
  handleHit: number,
): NavigatorDragMode => {
  "worklet";

  const toLeft = Math.abs(x - windowLeft);
  const toRight = Math.abs(x - windowRight);

  if (toLeft <= handleHit || toRight <= handleHit) {
    return toLeft < toRight ? "left" : "right";
  }

  return x > windowLeft && x < windowRight ? "move" : "jump";
};

/** Окно после сдвига пальца на `delta` (домен) в режиме `mode`. */
export const applyNavigatorDrag = (
  mode: NavigatorDragMode,
  range: ViewRange,
  delta: number,
  limits: ViewLimits,
): ViewRange => {
  "worklet";

  const minSpan = Math.min(limits.minSpan, limits.max - limits.min);

  if (mode === "left") {
    const start = Math.min(
      Math.max(range.start + delta, limits.min),
      range.end - minSpan,
    );

    return { start, end: range.end };
  }

  if (mode === "right") {
    const end = Math.max(
      Math.min(range.end + delta, limits.max),
      range.start + minSpan,
    );

    return { start: range.start, end };
  }

  return clampRange(panRange(range, delta), limits);
};

/** Окно той же ширины с центром в `center` (в пределах данных). */
export const centerRangeAt = (
  range: ViewRange,
  center: number,
  limits: ViewLimits,
): ViewRange => {
  "worklet";

  const half = (range.end - range.start) / 2;

  return clampRange({ start: center - half, end: center + half }, limits);
};
