import React, {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

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
import { useDomain, useScale, useSeriesGeometry } from "./hooks";
import { useActiveIndices } from "./interaction";
import { ActivePoint, ChartProviderProps } from "./types";

/** Контекст-провайдер графика: вычисляет домены, шкалы, геометрию и активные индексы. */
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

  // Отслеживание активных точек для обоих касаний.
  const [primaryIndex, setPrimaryIndex] = useState(
    () => active1.indices.value[0] ?? -1,
  );
  const [secondaryIndex, setSecondaryIndex] = useState(
    () => active2.indices.value[0] ?? -1,
  );

  const lastPrimarySV = useSharedValue(-2);
  const lastSecondarySV = useSharedValue(-2);

  useAnimatedReaction(
    () => active1.indices.value[0] ?? -1,
    next => {
      if (next !== lastPrimarySV.value) {
        lastPrimarySV.value = next;
        scheduleOnRN(setPrimaryIndex, next);
      }
    },
    [active1.indices, lastPrimarySV],
  );
  useAnimatedReaction(
    () => active2.indices.value[0] ?? -1,
    next => {
      if (next !== lastSecondarySV.value) {
        lastSecondarySV.value = next;
        scheduleOnRN(setSecondaryIndex, next);
      }
    },
    [active2.indices, lastSecondarySV],
  );

  const buildPoints = useCallback(
    (index: number): ActivePoint[] | null => {
      if (index < 0) return null;

      const items = series.filter(item => item.data[index] !== undefined);

      return items.length > 0
        ? items.map(item => ({ series: item, datum: item.data[index] }))
        : null;
    },
    [series],
  );

  useEffect(() => {
    if (!onChange) return;

    onChange(buildPoints(primaryIndex), buildPoints(secondaryIndex));
  }, [primaryIndex, secondaryIndex, buildPoints, onChange]);

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
