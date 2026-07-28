import type { IScale } from "../core/types";

export const computeBaselineY = (yScale: IScale, baseline?: number): number => {
  if (baseline !== undefined) {
    return yScale.toRange(baseline);
  }

  const [domainMin, domainMax] = yScale.domain;

  return yScale.toRange(Math.max(domainMin, Math.min(0, domainMax)));
};
