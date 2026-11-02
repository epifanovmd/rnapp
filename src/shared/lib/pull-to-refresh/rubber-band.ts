/**
 * Асимптотическое сопротивление протяжки (аналог iOS rubber band):
 * растёт монотонно, стремится к dimension, не превышая его.
 */
export const rubberBandDistance = (
  distance: number,
  dimension: number,
  coefficient = 0.55,
): number => {
  "worklet";

  if (distance <= 0) {
    return 0;
  }

  return (1 - 1 / ((distance * coefficient) / dimension + 1)) * dimension;
};
