import { DashPathEffect, Path } from "@shopify/react-native-skia";
import React, { FC } from "react";
import {
  DerivedValue,
  SharedValue,
  useDerivedValue,
} from "react-native-reanimated";

import type { IChartSeries, PixelPoint } from "../../core";
import {
  buildLinePathFromPoints,
  CurveType,
  TrendColorMap,
  TrendCompareMode,
  useTrendColor,
} from "../../core";

export interface LineSeriesPathProps {
  seriesId: string;
  seriesShared: SharedValue<IChartSeries[]>;
  /** Точки видимого среза серии в пиксельных координатах. */
  geometry: DerivedValue<Record<string, PixelPoint[]>>;
  curve: CurveType;
  color: string;
  /** Красить по тренду вместо `color`. */
  colorByTrend: boolean;
  trendCompare: TrendCompareMode;
  /** Цвета для up/down/flat трендов. */
  palette: TrendColorMap;
  strokeWidth: number;
  strokeCap: "butt" | "round" | "square";
  strokeJoin: "miter" | "round" | "bevel";
  /** Паттерн штрихов (px). */
  dashIntervals?: number[];
}

export const LineSeriesPath: FC<LineSeriesPathProps> = ({
  seriesId,
  seriesShared,
  geometry,
  curve,
  color,
  colorByTrend,
  trendCompare,
  palette,
  strokeWidth,
  strokeCap,
  strokeJoin,
  dashIntervals,
}) => {
  const path = useDerivedValue(
    () => buildLinePathFromPoints(geometry.value[seriesId] ?? [], curve),
    [geometry, seriesId, curve],
  );

  const lineColor = useTrendColor({
    seriesShared,
    seriesId,
    compare: trendCompare,
    enabled: colorByTrend,
    fallback: color,
    palette,
  });

  return (
    <Path
      path={path}
      style="stroke"
      strokeWidth={strokeWidth}
      strokeJoin={strokeJoin}
      strokeCap={strokeCap}
      color={lineColor}
    >
      {dashIntervals && <DashPathEffect intervals={dashIntervals} />}
    </Path>
  );
};
