import { useMemo } from "react";

import { createLinearScale } from "../../scales";
import type { ChartDimensions, IScale } from "../types";

export type ScaleAxis = "x" | "y";

/**
 * Создаёт linear scale с корректным range на основе `dimensions` и оси.
 *
 * - Для оси X: range = `[left, width - right]`.
 * - Для оси Y: range = `[height - bottom, top]`.
 * - `reverse` переворачивает range (удобно для инвертированных осей).
 */
export const useScale = (
  domain: [number, number],
  dimensions: ChartDimensions,
  axis: ScaleAxis,
  reverse = false,
): IScale =>
  useMemo(() => {
    if (axis === "x") {
      const left = dimensions.padding.left;
      const right = dimensions.width - dimensions.padding.right;

      return createLinearScale({
        domain,
        range: reverse ? [right, left] : [left, right],
      });
    }

    const top = dimensions.padding.top;
    const bottom = dimensions.height - dimensions.padding.bottom;

    return createLinearScale({
      domain,
      range: reverse ? [top, bottom] : [bottom, top],
    });
  }, [
    domain,
    axis,
    reverse,
    dimensions.width,
    dimensions.height,
    dimensions.padding.left,
    dimensions.padding.right,
    dimensions.padding.top,
    dimensions.padding.bottom,
  ]);
