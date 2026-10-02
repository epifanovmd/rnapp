import React, {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";

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
  useDomain,
  useSeriesGeometry,
  useSeriesLod,
  useVisibleSlices,
} from "./hooks";
import { useActiveIndices } from "./interaction";
import { createLinearScale } from "./scale/linear-scale";
import { resolveAutoYDomain } from "./scale/y-domain";
import { ActivePoint, ChartProviderProps } from "./types";
import { resolvePlotRect } from "./utils/plot-rect";
import {
  autoMinSpan,
  isRangeValid,
  lastRange,
  ViewRange,
} from "./viewport/viewport-math";

/** Длительность анимации домена Y, мс. */
const Y_DOMAIN_DURATION = 200;

/**
 * Контекст-провайдер графика: окно по X, домен Y по видимым точкам, шкалы,
 * срезы с уровнем детализации и пиксельная геометрия — всё на UI-потоке, жест
 * и смена окна не вызывают React-рендер.
 */
export const ChartProvider: FC<PropsWithChildren<ChartProviderProps>> = ({
  series,
  dimensions,
  interaction,
  viewport,
  xDomain,
  yDomain,
  beginAtZero = false,
  xPaddingRatio,
  yPaddingRatio = 0,
  yNice = 5,
  animateYDomain = true,
  xReverse = false,
  yReverse = false,
  onChange,
  children,
}) => {
  const bounds = useDomain(
    series,
    "x",
    { paddingRatio: xPaddingRatio },
    xDomain,
  );
  const minSpan = useMemo(() => autoMinSpan(series), [series]);
  const { applyBounds } = viewport.worklets;

  useEffect(() => {
    scheduleOnUI(applyBounds, bounds[0], bounds[1], minSpan);
  }, [applyBounds, bounds, minSpan]);

  const plot = useMemo(() => resolvePlotRect(dimensions), [dimensions]);

  const seriesShared = useSharedValue(series);

  useEffect(() => {
    seriesShared.value = series;
  }, [series, seriesShared]);

  const { start: viewStart, end: viewEnd, initialSpan } = viewport;
  const boundsMin = bounds[0];
  const boundsMax = bounds[1];

  // До первого applyBounds окно ещё NaN — берётся окно по initialSpan от данных.
  const view = useDerivedValue<ViewRange>(() => {
    const current = { start: viewStart.value, end: viewEnd.value };

    return isRangeValid(current)
      ? current
      : lastRange(initialSpan, { min: boundsMin, max: boundsMax, minSpan: 0 });
  }, [viewStart, viewEnd, initialSpan, boundsMin, boundsMax]);

  const xFrom = xReverse ? plot.right : plot.left;
  const xTo = xReverse ? plot.left : plot.right;

  const xScale = useDerivedValue(
    () => createLinearScale([view.value.start, view.value.end], [xFrom, xTo]),
    [view, xFrom, xTo],
  );

  const lod = useSeriesLod(seriesShared);
  const slices = useVisibleSlices(lod, view, Math.max(plot.width, 16));

  const fixedY = Array.isArray(yDomain) ? yDomain : undefined;
  const fixedYMin = fixedY?.[0];
  const fixedYMax = fixedY?.[1];
  const resolveY = typeof yDomain === "function" ? yDomain : undefined;
  const niceTickCount = yNice === false ? 0 : yNice;

  const yDomainTarget = useDerivedValue<[number, number] | null>(() => {
    if (fixedYMin !== undefined && fixedYMax !== undefined) {
      return [fixedYMin, fixedYMax];
    }

    const extent = slices.value.extent;

    if (!extent) {
      return null;
    }

    return resolveY
      ? resolveY(extent)
      : resolveAutoYDomain(extent, {
          beginAtZero,
          paddingRatio: yPaddingRatio,
          niceTickCount,
        });
  }, [
    fixedYMin,
    fixedYMax,
    slices,
    resolveY,
    beginAtZero,
    yPaddingRatio,
    niceTickCount,
  ]);

  const yMin = useSharedValue(NaN);
  const yMax = useSharedValue(NaN);

  useAnimatedReaction(
    () => yDomainTarget.value,
    (next, previous) => {
      if (!next) {
        return;
      }

      if (!animateYDomain || !previous || !Number.isFinite(yMin.value)) {
        yMin.value = next[0];
        yMax.value = next[1];

        return;
      }

      if (next[0] !== previous[0]) {
        yMin.value = withTiming(next[0], { duration: Y_DOMAIN_DURATION });
      }
      if (next[1] !== previous[1]) {
        yMax.value = withTiming(next[1], { duration: Y_DOMAIN_DURATION });
      }
    },
    [yDomainTarget, animateYDomain],
  );

  const yFrom = yReverse ? plot.top : plot.bottom;
  const yTo = yReverse ? plot.bottom : plot.top;

  const yScale = useDerivedValue(() => {
    const target = yDomainTarget.value;
    const low = Number.isFinite(yMin.value) ? yMin.value : (target?.[0] ?? 0);
    const high = Number.isFinite(yMax.value) ? yMax.value : (target?.[1] ?? 1);

    return createLinearScale([low, high], [yFrom, yTo]);
  }, [yDomainTarget, yMin, yMax, yFrom, yTo]);

  const geometry = useSeriesGeometry(slices, xScale, yScale);

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
    () => ({ dimensions, plot, xScale, yScale, yDomainTarget, viewport }),
    [dimensions, plot, xScale, yScale, yDomainTarget, viewport],
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
