import { LinearScale, scaleToRange } from "../core/scale/linear-scale";

/** Y-координата базовой линии для area/bar-графиков (worklet). */
export const computeBaselineY = (
  yScale: LinearScale,
  baseline?: number,
): number => {
  "worklet";

  if (baseline !== undefined) {
    return scaleToRange(yScale, baseline);
  }

  const low = Math.min(yScale.d0, yScale.d1);
  const high = Math.max(yScale.d0, yScale.d1);

  return scaleToRange(yScale, Math.max(low, Math.min(0, high)));
};
