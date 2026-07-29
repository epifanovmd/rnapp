import React, { FC, PropsWithChildren, useEffect, useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";

import {
  ChartActiveIndicesContext,
  ChartActiveIndicesState,
  ChartGeometryContext,
  ChartGeometryContextValue,
  ChartGestureContext,
  ChartGestureContextValue,
  ChartSeriesContext,
  ChartSeriesContextValue,
} from "./context";
import {
  useActivePointChange,
  useDomain,
  useScale,
  useSeriesGeometry,
} from "./hooks";
import { useActiveIndices } from "./interaction/useActiveIndices";
import { ActivePoint, ChartDimensions, IChartSeries } from "./types";

export interface ChartProviderProps {
  /** Серии данных; также определяют авто-домены x/y, если `xDomain`/`yDomain` не заданы. */
  series: IChartSeries[];
  /** Размеры канваса и отступы рабочей области — вычисляются `<Chart>` и прокидываются сюда. */
  dimensions: ChartDimensions;
  /** Базовые shared values жеста (`touchX`/`touchY`/`isActive` + второе касание) — прокидываются в контекст как есть. */
  interaction: ChartGestureContextValue;
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
  /** Срабатывает при смене активной (первое касание) точки по каждой серии; `null`, когда касание закончилось. */
  onChange?: (points: ActivePoint[] | null) => void;
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
  onChange,
  children,
}) => {
  const resolvedXDomain = useDomain(
    series,
    "x",
    { paddingRatio: xPaddingRatio },
    xDomain,
  );
  const resolvedYDomain = useDomain(
    series,
    "y",
    { beginAtZero, paddingRatio: yPaddingRatio },
    yDomain,
  );

  const xScale = useScale(resolvedXDomain, dimensions, "x", xReverse);
  const yScale = useScale(resolvedYDomain, dimensions, "y", yReverse);

  const seriesShared = useSharedValue(series);

  useEffect(() => {
    seriesShared.value = series;
  }, [series, seriesShared]);

  const geometry = useSeriesGeometry(seriesShared, xScale, yScale);

  const active1 = useActiveIndices(
    seriesShared,
    xScale,
    interaction.touchX,
    interaction.isActive,
  );
  const active2 = useActiveIndices(
    seriesShared,
    xScale,
    interaction.touchX2,
    interaction.isSecondActive,
  );

  useActivePointChange(active1.indices, series, onChange);

  const geometryValue = useMemo<ChartGeometryContextValue>(
    () => ({ dimensions, xScale, yScale }),
    [dimensions, xScale, yScale],
  );

  const seriesValue = useMemo<ChartSeriesContextValue>(
    () => ({ series, seriesShared, geometry }),
    [series, seriesShared, geometry],
  );

  const gestureValue = useMemo<ChartGestureContextValue>(
    () => ({
      touchX: interaction.touchX,
      touchY: interaction.touchY,
      isActive: interaction.isActive,
      touchX2: interaction.touchX2,
      touchY2: interaction.touchY2,
      isSecondActive: interaction.isSecondActive,
    }),
    [
      interaction.touchX,
      interaction.touchY,
      interaction.isActive,
      interaction.touchX2,
      interaction.touchY2,
      interaction.isSecondActive,
    ],
  );

  const activeIndicesValue = useMemo<ChartActiveIndicesState>(
    () => ({
      activeIndices: active1.indices,
      activeIndices2: active2.indices,
    }),
    [active1.indices, active2.indices],
  );

  return (
    <ChartGeometryContext.Provider value={geometryValue}>
      <ChartSeriesContext.Provider value={seriesValue}>
        <ChartGestureContext.Provider value={gestureValue}>
          <ChartActiveIndicesContext.Provider value={activeIndicesValue}>
            {children}
          </ChartActiveIndicesContext.Provider>
        </ChartGestureContext.Provider>
      </ChartSeriesContext.Provider>
    </ChartGeometryContext.Provider>
  );
};
