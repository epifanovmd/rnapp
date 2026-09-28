import { useMemo } from "react";

import {
  computeDomain,
  ComputeDomainOptions,
} from "../../scales/compute-domain";
import type { IChartSeries } from "../types";
import { useStableArray } from "./useStableArray";

/**
 * Вычисляет и стабилизирует домен оси.
 *
 * Если передан `fixed` — сразу возвращает его (явный домен).
 * Иначе вычисляет через `computeDomain`. Результат стабилизируется
 * `useStableArray` — если значения не изменились, ссылка остаётся прежней.
 */
export const useDomain = (
  series: IChartSeries[],
  axis: "x" | "y",
  options?: ComputeDomainOptions,
  fixed?: [number, number],
): [number, number] => {
  const { beginAtZero, paddingRatio } = options ?? {};

  return useStableArray(
    useMemo(
      () => fixed ?? computeDomain(series, axis, { beginAtZero, paddingRatio }),
      [series, axis, beginAtZero, paddingRatio, fixed],
    ),
  );
};
