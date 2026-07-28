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
  series: IChartSeries[];
  dimensions: ChartDimensions;
  interaction: ChartInteractionState;
  xDomain?: [number, number];
  yDomain?: [number, number];
  includeZero?: boolean;
  xPaddingRatio?: number;
  yPaddingRatio?: number;
  xReverse?: boolean;
  yReverse?: boolean;
}

export const ChartProvider: FC<PropsWithChildren<ChartProviderProps>> = ({
  series,
  dimensions,
  interaction,
  xDomain,
  yDomain,
  includeZero,
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
      computeDomain(series, "y", { includeZero, paddingRatio: yPaddingRatio }),
    [series, yDomain, includeZero, yPaddingRatio],
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
