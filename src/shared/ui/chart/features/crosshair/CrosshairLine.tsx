import { DashPathEffect, Group, Line, vec } from "@shopify/react-native-skia";
import React from "react";
import { useDerivedValue } from "react-native-reanimated";

import { scaleToRange } from "../../core";
import { CrosshairSeriesIndicator } from "./CrosshairSeriesIndicator";
import { CrosshairXLabel } from "./CrosshairXLabel";
import type { CrosshairLineProps } from "./types";

export const CrosshairLine = React.memo(
  ({
    series,
    seriesShared,
    dimensions,
    xScale,
    yScale,
    touchX,
    active,
    activeIndices,
    jsIndices,
    color,
    strokeWidth,
    markerRadius,
    showVerticalLine,
    showMarkers,
    showHorizontalLines,
    horizontalLineColor,
    labelSideX,
    labelSideY,
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

    const snappedX = useDerivedValue(() => {
      const index = activeIndices.value[0] ?? -1;
      const target =
        index >= 0 ? seriesShared.value[0]?.data[index] : undefined;

      return target ? scaleToRange(xScale.value, target.x) : touchX.value;
    }, [activeIndices, seriesShared, xScale, touchX]);

    const verticalP1 = useDerivedValue(
      () => vec(snappedX.value, dimensions.padding.top),
      [snappedX, dimensions],
    );

    const verticalP2 = useDerivedValue(
      () => vec(snappedX.value, dimensions.height - dimensions.padding.bottom),
      [snappedX, dimensions],
    );

    const opacity = useDerivedValue(() => (active.value ? 1 : 0), [active]);

    const activeIndex = jsIndices[0] ?? -1;

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
            jsIndex={jsIndices[index] ?? -1}
            seriesShared={seriesShared}
            activeIndices={activeIndices}
            xScale={xScale}
            yScale={yScale}
            color={item.color}
            radius={markerRadius}
            strokeWidth={strokeWidth}
            dashIntervals={dashIntervals}
            left={left}
            right={right}
            canvasWidth={dimensions.width}
            canvasHeight={dimensions.height}
            showMarker={showMarkers}
            showHorizontalLine={showHorizontalLines}
            horizontalLineColor={horizontalLineColor}
            labelSide={labelSideY}
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
            labelSide={labelSideX}
            canvasWidth={dimensions.width}
            canvasHeight={dimensions.height}
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
