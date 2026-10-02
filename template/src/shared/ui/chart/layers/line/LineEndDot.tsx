import { Circle, Group, vec } from "@shopify/react-native-skia";
import React, { FC } from "react";
import {
  DerivedValue,
  SharedValue,
  useDerivedValue,
} from "react-native-reanimated";

import type { IChartSeries, LinearScale } from "../../core";
import {
  isInScaleRange,
  scaleToRange,
  TrendColorMap,
  TrendCompareMode,
  useTrendColor,
} from "../../core";

export interface LineEndDotProps {
  seriesId: string;
  seriesShared: SharedValue<IChartSeries[]>;
  xScale: DerivedValue<LinearScale>;
  yScale: DerivedValue<LinearScale>;
  color: string;
  colorByTrend: boolean;
  trendCompare: TrendCompareMode;
  palette: TrendColorMap;
  radius: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth: number;
}

/** Точка на последнем значении серии; скрыта, если оно за краем окна. */
export const LineEndDot: FC<LineEndDotProps> = ({
  seriesId,
  seriesShared,
  xScale,
  yScale,
  color,
  colorByTrend,
  trendCompare,
  palette,
  radius,
  fillColor,
  strokeColor,
  strokeWidth,
}) => {
  const lineColor = useTrendColor({
    seriesShared,
    seriesId,
    compare: trendCompare,
    enabled: colorByTrend,
    fallback: color,
    palette,
  });

  const dotColor = useDerivedValue(
    () => fillColor ?? lineColor.value,
    [fillColor, lineColor],
  );

  const point = useDerivedValue(() => {
    const item = seriesShared.value.find(
      candidate => candidate.id === seriesId,
    );
    const last = item?.data[item.data.length - 1];

    if (!last) {
      return null;
    }

    const x = scaleToRange(xScale.value, last.x);

    return isInScaleRange(xScale.value, x, 1)
      ? { x, y: scaleToRange(yScale.value, last.y) }
      : null;
  }, [seriesShared, seriesId, xScale, yScale]);

  const center = useDerivedValue(
    () => (point.value ? vec(point.value.x, point.value.y) : vec(0, 0)),
    [point],
  );
  const opacity = useDerivedValue(() => (point.value ? 1 : 0), [point]);

  return (
    <Group opacity={opacity}>
      <Circle c={center} r={radius} color={dotColor} />
      {strokeColor && (
        <Circle
          c={center}
          r={radius}
          style="stroke"
          strokeWidth={strokeWidth}
          color={strokeColor}
        />
      )}
    </Group>
  );
};
