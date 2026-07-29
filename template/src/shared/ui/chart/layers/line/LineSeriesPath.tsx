import { Circle, DashPathEffect, Path, vec } from "@shopify/react-native-skia";
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
  geometry: DerivedValue<Record<string, PixelPoint[]>>;
  curve: CurveType;
  color: string;
  colorByTrend: boolean;
  trendCompare: TrendCompareMode;
  palette: TrendColorMap;
  strokeWidth: number;
  strokeCap: "butt" | "round" | "square";
  strokeJoin: "miter" | "round" | "bevel";
  dashIntervals?: number[];
  showEndDot: boolean;
  endDotRadius: number;
  endDotColor?: string;
  endDotStrokeColor?: string;
  endDotStrokeWidth: number;
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
  showEndDot,
  endDotRadius,
  endDotColor,
  endDotStrokeColor,
  endDotStrokeWidth,
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

  const dotColor = useDerivedValue(
    () => endDotColor ?? lineColor.value,
    [endDotColor, lineColor],
  );

  const endPoint = useDerivedValue(() => {
    const points = geometry.value[seriesId];
    const last = points?.[points.length - 1];

    return last ? vec(last.x, last.y) : vec(0, 0);
  }, [geometry, seriesId]);

  return (
    <>
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
      {showEndDot && (
        <>
          <Circle c={endPoint} r={endDotRadius} color={dotColor} />
          {endDotStrokeColor && (
            <Circle
              c={endPoint}
              r={endDotRadius}
              style="stroke"
              strokeWidth={endDotStrokeWidth}
              color={endDotStrokeColor}
            />
          )}
        </>
      )}
    </>
  );
};
