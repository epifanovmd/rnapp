import { Circle, DashPathEffect, Path } from "@shopify/react-native-skia";
import React, { FC, useMemo } from "react";

import { useChartContext } from "../../core/chart-context";
import {
  computeTrend,
  resolveTrendColor,
  TrendCompareMode,
} from "../../core/compute-trend";
import { LineDashType, resolveDashIntervals } from "../../core/dash-pattern";
import { DEFAULT_SERIES_COLORS } from "../../core/default-series-colors";
import { resolveSeriesColor } from "../../core/resolve-series-color";
import { selectSeries, SeriesSelector } from "../../core/select-series";
import type { ChartLayerComponent } from "../../core/types";
import { buildLinePath, CurveType } from "./build-line-path";

export interface LineLayerProps extends SeriesSelector {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Прямые сегменты или сглаженная (catmull-rom) кривая. */
  curve?: CurveType;
  /** Толщина линии (px). */
  strokeWidth?: number;
  /** Цвета по сериям (по кругу, если серий больше); переопределяется собственным `series.color`. Игнорируется при `colorByTrend`. */
  colors?: string[];
  /** Форма концов линии. */
  strokeCap?: "butt" | "round" | "square";
  /** Форма соединения сегментов линии. */
  strokeJoin?: "miter" | "round" | "bevel";
  /** Сплошная, пунктирная или точечная линия. */
  lineType?: LineDashType;
  /** Свой паттерн штрихов (px); учитывается только если `lineType` не `"solid"`. */
  dashArray?: number[];
  /** Рисовать точку в последней точке данных каждой серии (на конце линии). */
  showEndDot?: boolean;
  /** Радиус точки на конце линии (px). */
  endDotRadius?: number;
  /** Цвет заливки точки на конце линии (по умолчанию — цвет самой линии этой серии). */
  endDotColor?: string;
  /** Цвет обводки точки на конце линии (без него обводка не рисуется). */
  endDotStrokeColor?: string;
  /** Толщина обводки точки на конце линии (px). */
  endDotStrokeWidth?: number;
  /** Красить каждую линию по её тренду (рост/падение) вместо `colors`/`series.color`. */
  colorByTrend?: boolean;
  /** С чем сравнивать при определении тренда: с первой точкой серии или с предыдущей. */
  trendCompare?: TrendCompareMode;
  /** Цвет при росте (используется вместе с `colorByTrend`). */
  upColor?: string;
  /** Цвет при падении (используется вместе с `colorByTrend`). */
  downColor?: string;
  /** Цвет при отсутствии изменения (используется вместе с `colorByTrend`). */
  neutralColor?: string;
}

export const LineLayer: ChartLayerComponent<LineLayerProps> = ({
  visible = true,
  curve = "linear",
  strokeWidth = 2,
  colors = DEFAULT_SERIES_COLORS,
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
  upColor = "#10B981",
  downColor = "#EF4444",
  neutralColor = "#94A3B8",
  ...selector
}) => {
  const { series, xScale, yScale } = useChartContext();
  const resolvedSeries = selectSeries(series, selector);
  const intervals = resolveDashIntervals(lineType, dashArray);

  const paths = useMemo(
    () =>
      resolvedSeries.map((item, index) => {
        const lastDatum = item.data[item.data.length - 1];

        return {
          id: item.id,
          color: colorByTrend
            ? resolveTrendColor(
                computeTrend(item.data, trendCompare)?.direction ?? "flat",
                upColor,
                downColor,
                neutralColor,
              )
            : resolveSeriesColor(item, index, colors),
          path: buildLinePath(item.data, xScale, yScale, curve),
          endPoint: lastDatum
            ? {
                x: xScale.toRange(lastDatum.x),
                y: yScale.toRange(lastDatum.y),
              }
            : null,
        };
      }),
    [
      resolvedSeries,
      xScale,
      yScale,
      curve,
      colors,
      colorByTrend,
      trendCompare,
      upColor,
      downColor,
      neutralColor,
    ],
  );

  if (!visible) {
    return null;
  }

  return (
    <>
      {paths.map(item => (
        <React.Fragment key={item.id}>
          <Path
            path={item.path}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeJoin={strokeJoin}
            strokeCap={strokeCap}
            color={item.color}
          >
            {intervals && <DashPathEffect intervals={intervals} />}
          </Path>
          {showEndDot && item.endPoint && (
            <>
              <Circle
                cx={item.endPoint.x}
                cy={item.endPoint.y}
                r={endDotRadius}
                color={endDotColor ?? item.color}
              />
              {endDotStrokeColor && (
                <Circle
                  cx={item.endPoint.x}
                  cy={item.endPoint.y}
                  r={endDotRadius}
                  style="stroke"
                  strokeWidth={endDotStrokeWidth}
                  color={endDotStrokeColor}
                />
              )}
            </>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

LineLayer.layerKind = "skia";
