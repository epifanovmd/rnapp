import { Circle } from "@shopify/react-native-skia";
import React, { useMemo } from "react";

import { useChartContext } from "../../core/chart-context";
import { DEFAULT_SERIES_COLORS } from "../../core/default-series-colors";
import { useOnTouchDown } from "../../core/interaction/useOnTouchDown";
import { resolveSeriesColor } from "../../core/resolve-series-color";
import { selectSeries, SeriesSelector } from "../../core/select-series";
import type {
  ChartDatum,
  ChartLayerComponent,
  IChartSeries,
} from "../../core/types";

export interface ScatterPointPressInfo {
  series: IChartSeries;
  datum: ChartDatum;
  index: number;
}

export interface ScatterLayerProps extends SeriesSelector {
  visible?: boolean;
  radius?: number;
  colors?: string[];
  style?: "fill" | "stroke";
  strokeWidth?: number;
  hitSlop?: number;
  onPointPress?: (info: ScatterPointPressInfo) => void;
}

export const ScatterLayer: ChartLayerComponent<ScatterLayerProps> = ({
  visible = true,
  radius = 4,
  colors = DEFAULT_SERIES_COLORS,
  style = "fill",
  strokeWidth = 2,
  hitSlop = 6,
  onPointPress,
  ...selector
}) => {
  const { series, xScale, yScale, interaction } = useChartContext();
  const resolvedSeries = selectSeries(series, selector);

  const points = useMemo(
    () =>
      resolvedSeries.flatMap((item, seriesIndex) =>
        item.data.map((datum, index) => ({
          series: item,
          datum,
          index,
          x: xScale.toRange(datum.x),
          y: yScale.toRange(datum.y),
          color: resolveSeriesColor(item, seriesIndex, colors),
        })),
      ),
    [resolvedSeries, xScale, yScale, colors],
  );

  useOnTouchDown(
    interaction.touchX,
    interaction.touchY,
    interaction.isActive,
    (x, y) => {
      if (!onPointPress) {
        return;
      }

      const r = radius + hitSlop;
      const hit = points.find(point => {
        const dx = x - point.x;
        const dy = y - point.y;

        return dx * dx + dy * dy <= r * r;
      });

      if (hit) {
        onPointPress({
          series: hit.series,
          datum: hit.datum,
          index: hit.index,
        });
      }
    },
  );

  if (!visible) {
    return null;
  }

  return (
    <>
      {points.map((point, index) => (
        <Circle
          key={`${point.series.id}-${index}`}
          cx={point.x}
          cy={point.y}
          r={radius}
          color={point.color}
          style={style}
          strokeWidth={style === "stroke" ? strokeWidth : undefined}
        />
      ))}
    </>
  );
};

ScatterLayer.layerKind = "skia";
