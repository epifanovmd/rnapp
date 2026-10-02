import { Circle, DashPathEffect, Line, vec } from "@shopify/react-native-skia";
import React from "react";
import { useDerivedValue } from "react-native-reanimated";

import { scaleToRange } from "../../core";
import { CrosshairYLabel } from "./CrosshairYLabel";
import type { CrosshairSeriesIndicatorProps } from "./types";

export const CrosshairSeriesIndicator = React.memo(
  ({
    series,
    seriesIndex,
    jsIndex,
    seriesShared,
    activeIndices,
    xScale,
    yScale,
    color,
    radius,
    strokeWidth,
    dashIntervals,
    left,
    right,
    canvasWidth,
    canvasHeight,
    showMarker,
    showHorizontalLine,
    horizontalLineColor,
    labelSide,
    showLabel,
    labelPosition,
    labelFormatter,
    font,
    fontSize,
    labelBackground,
    labelTextColor,
  }: CrosshairSeriesIndicatorProps) => {
    const point = useDerivedValue(() => {
      const index = activeIndices.value[seriesIndex] ?? -1;
      const target =
        index >= 0 ? seriesShared.value[seriesIndex]?.data[index] : undefined;

      return target
        ? vec(
            scaleToRange(xScale.value, target.x),
            scaleToRange(yScale.value, target.y),
          )
        : vec(0, 0);
    }, [activeIndices, seriesShared, xScale, yScale, seriesIndex]);

    const horizontalP1 = useDerivedValue(
      () => vec(left, point.value.y),
      [point, left],
    );

    const horizontalP2 = useDerivedValue(
      () => vec(right, point.value.y),
      [point, right],
    );


    const labelText =
      showLabel && jsIndex >= 0 && series.data[jsIndex]
        ? labelFormatter(series.data[jsIndex].y, series)
        : "";

    const horizontalColor = horizontalLineColor ?? color;

    return (
      <>
        {showHorizontalLine && (
          <Line
            p1={horizontalP1}
            p2={horizontalP2}
            color={horizontalColor}
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
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            position={labelPosition}
            labelSide={labelSide}
            text={labelText}
            font={font}
            fontSize={fontSize}
            background={labelBackground}
            textColor={labelTextColor}
          />
        )}
      </>
    );
  },
);
