import { Circle, DashPathEffect, Line, vec } from "@shopify/react-native-skia";
import React, { FC, useState } from "react";
import { useAnimatedReaction, useDerivedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { CrosshairYLabel } from "./CrosshairYLabel";
import type { CrosshairSeriesIndicatorProps } from "./types";

export const CrosshairSeriesIndicator = React.memo(
  ({
    series,
    seriesIndex,
    activeIndices,
    geometry,
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
      const points = geometry.value[series.id];
      const target = index >= 0 ? points?.[index] : undefined;

      return target ? vec(target.x, target.y) : vec(0, 0);
    }, [activeIndices, geometry, seriesIndex, series.id]);

    const horizontalP1 = useDerivedValue(
      () => vec(left, point.value.y),
      [point, left],
    );

    const horizontalP2 = useDerivedValue(
      () => vec(right, point.value.y),
      [point, right],
    );

    // activeIndex bridge в JS для текста Y-лейбла (своя серия).
    const [activeIndexJS, setActiveIndexJS] = useState(
      () => activeIndices.value[seriesIndex] ?? -1,
    );

    useAnimatedReaction(
      () => activeIndices.value[seriesIndex] ?? -1,
      (next, previous) => {
        if (next !== previous) {
          scheduleOnRN(setActiveIndexJS, next);
        }
      },
      [activeIndices, seriesIndex],
    );

    const labelText =
      showLabel && activeIndexJS >= 0 && series.data[activeIndexJS]
        ? labelFormatter(series.data[activeIndexJS].y, series)
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
