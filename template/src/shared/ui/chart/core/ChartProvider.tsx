import React, { FC, PropsWithChildren, useMemo } from "react";

import { computeDomain } from "../scales/compute-domain";
import { createLinearScale } from "../scales/createLinearScale";
import {
  ChartContext,
  ChartContextValue,
  ChartInteractionState,
} from "./chart-context";
import { ChartDimensions, IChartSeries } from "./types";

export interface ChartProviderProps {
  /** Серии данных; также определяют авто-домены x/y, если `xDomain`/`yDomain` не заданы. */
  series: IChartSeries[];
  /** Размеры канваса и отступы рабочей области — вычисляются `<Chart>` и прокидываются сюда. */
  dimensions: ChartDimensions;
  /** Shared values жеста (`touchX`/`touchY`/`isActive` + второе касание) — прокидываются в контекст как есть. */
  interaction: ChartInteractionState;
  /** Фиксированный домен оси X; без него вычисляется из данных `series`. */
  xDomain?: [number, number];
  /** Фиксированный домен оси Y; без него вычисляется из данных `series`. */
  yDomain?: [number, number];
  /** Заставляет авто-домен Y включать 0. */
  beginAtZero?: boolean;
  /** Доп. запас по краям авто-домена X, в долях от его размаха. */
  xPaddingRatio?: number;
  /** Доп. запас по краям авто-домена Y, в долях от его размаха. */
  yPaddingRatio?: number;
  /** Меняет местами края, на которые проецируются min/max домена X. */
  xReverse?: boolean;
  /** Меняет местами края, на которые проецируются min/max домена Y. */
  yReverse?: boolean;
}

export const ChartProvider: FC<PropsWithChildren<ChartProviderProps>> = ({
  series,
  dimensions,
  interaction,
  xDomain,
  yDomain,
  beginAtZero,
  xPaddingRatio,
  yPaddingRatio,
  xReverse = false,
  yReverse = false,
  children,
}) => {
  const resolvedXDomain = useMemo(
    () =>
      xDomain ?? computeDomain(series, "x", { paddingRatio: xPaddingRatio }),
    [series, xDomain, xPaddingRatio],
  );

  const resolvedYDomain = useMemo(
    () =>
      yDomain ??
      computeDomain(series, "y", { beginAtZero, paddingRatio: yPaddingRatio }),
    [series, yDomain, beginAtZero, yPaddingRatio],
  );

  const xScale = useMemo(() => {
    const left = dimensions.padding.left;
    const right = dimensions.width - dimensions.padding.right;

    return createLinearScale({
      domain: resolvedXDomain,
      range: xReverse ? [right, left] : [left, right],
    });
  }, [
    resolvedXDomain,
    dimensions.width,
    dimensions.padding.left,
    dimensions.padding.right,
    xReverse,
  ]);

  const yScale = useMemo(() => {
    const top = dimensions.padding.top;
    const bottom = dimensions.height - dimensions.padding.bottom;

    return createLinearScale({
      domain: resolvedYDomain,
      range: yReverse ? [top, bottom] : [bottom, top],
    });
  }, [
    resolvedYDomain,
    dimensions.height,
    dimensions.padding.top,
    dimensions.padding.bottom,
    yReverse,
  ]);

  const value = useMemo<ChartContextValue>(
    () => ({ dimensions, xScale, yScale, series, interaction }),
    [dimensions, xScale, yScale, series, interaction],
  );

  return (
    <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
  );
};
