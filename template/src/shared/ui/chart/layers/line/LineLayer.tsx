import { DashPathEffect, Path } from "@shopify/react-native-skia";
import React, { FC, useMemo } from "react";

import { useChartContext } from "../../core/chart-context";
import { LineDashType, resolveDashIntervals } from "../../core/dash-pattern";
import { DEFAULT_SERIES_COLORS } from "../../core/default-series-colors";
import { resolveSeriesColor } from "../../core/resolve-series-color";
import { selectSeries, SeriesSelector } from "../../core/select-series";
import type { ChartLayerComponent } from "../../core/types";
import { buildLinePath, CurveType } from "./build-line-path";

export interface LineLayerProps extends SeriesSelector {
  visible?: boolean;
  curve?: CurveType;
  strokeWidth?: number;
  colors?: string[];
  strokeCap?: "butt" | "round" | "square";
  strokeJoin?: "miter" | "round" | "bevel";
  lineType?: LineDashType;
  dashArray?: number[];
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
  ...selector
}) => {
  const { series, xScale, yScale } = useChartContext();
  const resolvedSeries = selectSeries(series, selector);
  const intervals = resolveDashIntervals(lineType, dashArray);

  const paths = useMemo(
    () =>
      resolvedSeries.map(item => ({
        id: item.id,
        color: item.color,
        path: buildLinePath(item.data, xScale, yScale, curve),
      })),
    [resolvedSeries, xScale, yScale, curve],
  );

  if (!visible) {
    return null;
  }

  return (
    <>
      {paths.map((item, index) => (
        <Path
          key={item.id}
          path={item.path}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeJoin={strokeJoin}
          strokeCap={strokeCap}
          color={resolveSeriesColor(item, index, colors)}
        >
          {intervals && <DashPathEffect intervals={intervals} />}
        </Path>
      ))}
    </>
  );
};

LineLayer.layerKind = "skia";
