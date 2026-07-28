import { Circle, DashPathEffect, Line, vec } from "@shopify/react-native-skia";
import React, { FC } from "react";
import { SharedValue, useDerivedValue } from "react-native-reanimated";

import { findNearestIndex } from "../../core/interaction/nearest-point";
import { useAnimatedSyncedState } from "../../core/interaction/useAnimatedSyncedState";
import type { IChartSeries, IScale } from "../../core/types";
import { CrosshairYLabel } from "./CrosshairYLabel";
import type { SkFont } from "./label-style";

export interface CrosshairSeriesIndicatorProps {
  series: IChartSeries;
  color: string;
  xScale: IScale;
  yScale: IScale;
  touchX: SharedValue<number>;
  radius: number;
  strokeWidth: number;
  dashIntervals?: number[];
  left: number;
  right: number;
  showMarker: boolean;
  showHorizontalLine: boolean;
  showLabel: boolean;
  labelPosition: "left" | "right";
  labelFormatter: (value: number, series: IChartSeries) => string;
  font: SkFont;
  fontSize: number;
  labelBackground: string;
  labelTextColor: string;
}

export const CrosshairSeriesIndicator: FC<CrosshairSeriesIndicatorProps> = ({
  series,
  color,
  xScale,
  yScale,
  touchX,
  radius,
  strokeWidth,
  dashIntervals,
  left,
  right,
  showMarker,
  showHorizontalLine,
  showLabel,
  labelPosition,
  labelFormatter,
  font,
  fontSize,
  labelBackground,
  labelTextColor,
}) => {
  const point = useDerivedValue(() => {
    if (series.data.length === 0) {
      return vec(0, 0);
    }

    const index = findNearestIndex(xScale, series.data, touchX.value);

    if (index < 0) {
      return vec(0, 0);
    }

    return vec(
      xScale.toRange(series.data[index].x),
      yScale.toRange(series.data[index].y),
    );
  }, [series, xScale, yScale, touchX]);

  const horizontalP1 = useDerivedValue(
    () => vec(left, point.value.y),
    [point, left],
  );

  const horizontalP2 = useDerivedValue(
    () => vec(right, point.value.y),
    [point, right],
  );

  const activeIndex = useAnimatedSyncedState(
    () => {
      "worklet";

      return series.data.length === 0
        ? -1
        : findNearestIndex(xScale, series.data, touchX.value);
    },
    [series, xScale, touchX],
    -1,
  );

  const labelText =
    showLabel && activeIndex >= 0
      ? labelFormatter(series.data[activeIndex].y, series)
      : "";

  return (
    <>
      {showHorizontalLine && (
        <Line
          p1={horizontalP1}
          p2={horizontalP2}
          color={color}
          strokeWidth={strokeWidth}
        >
          {dashIntervals && <DashPathEffect intervals={dashIntervals} />}
        </Line>
      )}
      {showMarker && <Circle c={point} r={radius} color={color} />}
      {showLabel && labelText !== "" && (
        <CrosshairYLabel
          anchorPoint={point}
          edgeX={labelPosition === "right" ? right : left}
          position={labelPosition}
          text={labelText}
          font={font}
          fontSize={fontSize}
          background={labelBackground}
          textColor={labelTextColor}
        />
      )}
    </>
  );
};
