import { DashPathEffect, Group, Line, vec } from "@shopify/react-native-skia";
import React, { FC, useState } from "react";
import { useAnimatedReaction, useDerivedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { CrosshairSeriesIndicator } from "./CrosshairSeriesIndicator";
import { CrosshairXLabel } from "./CrosshairXLabel";
import type { CrosshairLineProps } from "./types";

export const CrosshairLine = React.memo(
  ({
    series,
    dimensions,
    geometry,
    touchX,
    active,
    activeIndices,
    color,
    strokeWidth,
    markerRadius,
    showVerticalLine,
    showMarkers,
    showHorizontalLines,
    dashIntervals,
    showXLabel,
    xLabelPosition,
    xLabelFormatter,
    showYLabels,
    yLabelPosition,
    yLabelFormatter,
    font,
    fontSize,
    labelBackground,
    labelTextColor,
  }: CrosshairLineProps) => {
    const referenceData = series[0]?.data ?? [];
    const firstSeriesId = series[0]?.id;

    const snappedX = useDerivedValue(() => {
      const index = activeIndices.value[0] ?? -1;
      const points = firstSeriesId ? geometry.value[firstSeriesId] : undefined;
      const target = index >= 0 ? points?.[index] : undefined;

      return target ? target.x : touchX.value;
    }, [activeIndices, geometry, touchX, firstSeriesId]);

    const verticalP1 = useDerivedValue(
      () => vec(snappedX.value, dimensions.padding.top),
      [snappedX, dimensions],
    );

    const verticalP2 = useDerivedValue(
      () => vec(snappedX.value, dimensions.height - dimensions.padding.bottom),
      [snappedX, dimensions],
    );

    const opacity = useDerivedValue(() => (active.value ? 1 : 0), [active]);

    // X-лейблу нужен JS-текст только по первой серии — мирим напрямую из
    // `activeIndices`, локально для этого компонента, а не через общий
    // JS-зеркалированный массив на весь график.
    const [activeIndex, setActiveIndex] = useState(
      () => activeIndices.value[0] ?? -1,
    );

    useAnimatedReaction(
      () => activeIndices.value[0] ?? -1,
      (next, previous) => {
        if (next !== previous) {
          scheduleOnRN(setActiveIndex, next);
        }
      },
      [activeIndices],
    );

    const xLabelText =
      showXLabel && activeIndex >= 0 && referenceData[activeIndex]
        ? xLabelFormatter(referenceData[activeIndex].x)
        : "";

    const left = dimensions.padding.left;
    const right = dimensions.width - dimensions.padding.right;

    return (
      <Group opacity={opacity}>
        {showVerticalLine && (
          <Line
            p1={verticalP1}
            p2={verticalP2}
            color={color}
            strokeWidth={strokeWidth}
          >
            {dashIntervals && <DashPathEffect intervals={dashIntervals} />}
          </Line>
        )}
        {series.map((item, index) => (
          <CrosshairSeriesIndicator
            key={item.id}
            series={item}
            seriesIndex={index}
            activeIndices={activeIndices}
            geometry={geometry}
            color={item.color}
            radius={markerRadius}
            strokeWidth={strokeWidth}
            dashIntervals={dashIntervals}
            left={left}
            right={right}
            canvasWidth={dimensions.width}
            showMarker={showMarkers}
            showHorizontalLine={showHorizontalLines}
            showLabel={showYLabels}
            labelPosition={yLabelPosition}
            labelFormatter={yLabelFormatter}
            font={font}
            fontSize={fontSize}
            labelBackground={labelBackground}
            labelTextColor={labelTextColor}
          />
        ))}
        {showXLabel && xLabelText !== "" && (
          <CrosshairXLabel
            anchorX={snappedX}
            edgeY={
              xLabelPosition === "top"
                ? dimensions.padding.top
                : dimensions.height - dimensions.padding.bottom
            }
            position={xLabelPosition}
            text={xLabelText}
            font={font}
            fontSize={fontSize}
            background={labelBackground}
            textColor={labelTextColor}
          />
        )}
      </Group>
    );
  },
);
