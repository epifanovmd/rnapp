import { LinearGradient, Path, vec } from "@shopify/react-native-skia";
import React, { FC } from "react";
import {
  DerivedValue,
  SharedValue,
  useDerivedValue,
} from "react-native-reanimated";

import type { IChartSeries, PixelPoint } from "../../core";
import {
  buildAreaPathFromPoints,
  CurveType,
  TrendColorMap,
  TrendCompareMode,
  useTrendColor,
  withOpacity,
} from "../../core";

export interface AreaSeriesPathProps {
  seriesId: string;
  seriesShared: SharedValue<IChartSeries[]>;
  /** Точки серии в пиксельных координатах. */
  geometry: DerivedValue<Record<string, PixelPoint[]>>;
  curve: CurveType;
  /** Y-координата базовой линии (px). */
  baselineY: number;
  color: string;
  /** Красить по тренду вместо `color`. */
  colorByTrend: boolean;
  trendCompare: TrendCompareMode;
  /** Цвета для up/down/flat трендов. */
  palette: TrendColorMap;
  opacity: number;
  gradient: boolean;
  /** Верхняя граница градиента (px). */
  gradientTop: number;
  /** Нижняя граница градиента (px). */
  gradientBottom: number;
}

export const AreaSeriesPath: FC<AreaSeriesPathProps> = ({
  seriesId,
  seriesShared,
  geometry,
  curve,
  baselineY,
  color,
  colorByTrend,
  trendCompare,
  palette,
  opacity,
  gradient,
  gradientTop,
  gradientBottom,
}) => {
  const path = useDerivedValue(
    () =>
      buildAreaPathFromPoints(geometry.value[seriesId] ?? [], curve, baselineY),
    [geometry, seriesId, curve, baselineY],
  );

  const areaColor = useTrendColor({
    seriesShared,
    seriesId,
    compare: trendCompare,
    enabled: colorByTrend,
    fallback: color,
    palette,
  });

  const fillColor = useDerivedValue(
    () => withOpacity(areaColor.value, opacity),
    [areaColor, opacity],
  );

  const gradientColors = useDerivedValue(
    () => [
      withOpacity(areaColor.value, opacity),
      withOpacity(areaColor.value, 0),
    ],
    [areaColor, opacity],
  );

  return (
    <Path path={path} style="fill" color={gradient ? undefined : fillColor}>
      {gradient && (
        <LinearGradient
          start={vec(0, gradientTop)}
          end={vec(0, gradientBottom)}
          colors={gradientColors}
        />
      )}
    </Path>
  );
};
