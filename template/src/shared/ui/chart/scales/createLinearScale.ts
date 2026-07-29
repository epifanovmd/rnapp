import type { IScale } from "../core";

export interface LinearScaleOptions {
  domain: [number, number];
  range: [number, number];
}

/** Создаёт линейную шкалу: domain -> range (с обратным отображением и тиками). */
export const createLinearScale = ({
  domain,
  range,
}: LinearScaleOptions): IScale => {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const domainSpan = d1 - d0 || 1;
  const rangeSpan = r1 - r0;

  const toRange = (value: number) => {
    "worklet";

    return r0 + ((value - d0) / domainSpan) * rangeSpan;
  };

  const toDomain = (value: number) => {
    "worklet";

    return d0 + ((value - r0) / (rangeSpan || 1)) * domainSpan;
  };

  const ticks = (count = 5) => {
    "worklet";

    if (count <= 0) {
      return [];
    }

    const step = domainSpan / count;

    return Array.from({ length: count + 1 }, (_, index) => d0 + step * index);
  };

  return { domain, range, toRange, toDomain, ticks };
};
