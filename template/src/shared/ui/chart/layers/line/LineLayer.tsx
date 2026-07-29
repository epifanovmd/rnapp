import React, { useMemo } from "react";

import { useChartSeries } from "../../core/context";
import {
  DEFAULT_TREND_DOWN_COLOR,
  DEFAULT_TREND_NEUTRAL_COLOR,
  DEFAULT_TREND_UP_COLOR,
  TrendColorMap,
  TrendCompareMode,
} from "../../core/hooks/useTrendColor";
import type { ChartLayerComponent } from "../../core/types";
import { CurveType } from "../../core/utils/build-path";
import { DASH_PRESETS, LineDashType } from "../../core/utils/dash-pattern";
import { selectSeries } from "../../core/utils/select-series";
import { LineSeriesPath } from "./LineSeriesPath";

export interface LineLayerProps {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Тип кривой. */
  curve?: CurveType;
  /** px. */
  strokeWidth?: number;
  /** Форма концов. */
  strokeCap?: "butt" | "round" | "square";
  /** Форма соединений. */
  strokeJoin?: "miter" | "round" | "bevel";
  /** Сплошная/пунктирная/точечная. */
  lineType?: LineDashType;
  /** Свой паттерн штрихов (px); учитывается только если `lineType` не `"solid"`. */
  dashArray?: number[];
  /** Рисовать точку в последней точке данных каждой серии (на конце линии). */
  showEndDot?: boolean;
  /** px. */
  endDotRadius?: number;
  /** Цвет заливки точки на конце линии (по умолчанию — цвет самой линии этой серии). */
  endDotColor?: string;
  /** Цвет обводки точки на конце линии (без него обводка не рисуется). */
  endDotStrokeColor?: string;
  /** px. */
  endDotStrokeWidth?: number;
  /** Красить каждую линию по её тренду (рост/падение) вместо `series.color`. Цвет считается на UI-потоке (см. `useTrendColor`) — на live-графике не требует JS-рендера слоя. */
  colorByTrend?: boolean;
  /** С чем сравнивать при определении тренда: с первой точкой серии или с предыдущей. */
  trendCompare?: TrendCompareMode;
  /** Цвета трендов. */
  trendColors?: Partial<TrendColorMap>;
  /** Фильтр по id серии (undefined — все серии). */
  seriesId?: string;
}

/** Слой линий для серий графика. */
export const LineLayer: ChartLayerComponent<LineLayerProps> = ({
  visible = true,
  curve = "linear",
  strokeWidth = 2,
  strokeCap = "round",
  strokeJoin = "round",
  lineType = "solid",
  dashArray,
  showEndDot = false,
  endDotRadius = 4,
  endDotColor,
  endDotStrokeColor,
  endDotStrokeWidth = 2,
  colorByTrend = false,
  trendCompare = "previous",
  trendColors,
  seriesId,
}) => {
  const { series, seriesShared, geometry } = useChartSeries();
  const resolvedSeries = selectSeries(series, seriesId);
  const intervals = dashArray ?? DASH_PRESETS[lineType];

  const palette = useMemo<TrendColorMap>(
    () => ({
      up: DEFAULT_TREND_UP_COLOR,
      down: DEFAULT_TREND_DOWN_COLOR,
      flat: DEFAULT_TREND_NEUTRAL_COLOR,
      ...trendColors,
    }),
    [trendColors],
  );

  if (!visible) {
    return null;
  }

  return resolvedSeries.map(item => (
    <LineSeriesPath
      key={item.id}
      seriesId={item.id}
      seriesShared={seriesShared}
      geometry={geometry}
      curve={curve}
      color={item.color}
      colorByTrend={colorByTrend}
      trendCompare={trendCompare}
      palette={palette}
      strokeWidth={strokeWidth}
      strokeCap={strokeCap}
      strokeJoin={strokeJoin}
      dashIntervals={intervals}
      showEndDot={showEndDot && item.data.length > 0}
      endDotRadius={endDotRadius}
      endDotColor={endDotColor}
      endDotStrokeColor={endDotStrokeColor}
      endDotStrokeWidth={endDotStrokeWidth}
    />
  ));
};
