import { DashPathEffect, Group, Line, vec } from "@shopify/react-native-skia";
import React, { FC } from "react";
import { SharedValue, useDerivedValue } from "react-native-reanimated";

import { findActiveIndex } from "../../core/interaction/nearest-point";
import { useAnimatedSyncedState } from "../../core/interaction/useAnimatedSyncedState";
import type { SkFont } from "../../core/label-style";
import { resolveSeriesColor } from "../../core/resolve-series-color";
import type { ChartDimensions, IChartSeries, IScale } from "../../core/types";
import { CrosshairSeriesIndicator } from "./CrosshairSeriesIndicator";
import { CrosshairXLabel } from "./CrosshairXLabel";

export interface CrosshairLineProps {
  series: IChartSeries[];
  xScale: IScale;
  yScale: IScale;
  dimensions: ChartDimensions;
  touchX: SharedValue<number>;
  active: SharedValue<boolean>;
  color: string;
  colors: string[];
  strokeWidth: number;
  markerRadius: number;
  showVerticalLine: boolean;
  showMarkers: boolean;
  showHorizontalLines: boolean;
  dashIntervals?: number[];
  showXLabel: boolean;
  xLabelPosition: "top" | "bottom";
  xLabelFormatter: (value: number) => string;
  showYLabels: boolean;
  yLabelPosition: "left" | "right";
  yLabelFormatter: (value: number, series: IChartSeries) => string;
  font: SkFont;
  fontSize: number;
  labelBackground: string;
  labelTextColor: string;
}

export const CrosshairLine: FC<CrosshairLineProps> = ({
  series,
  xScale,
  yScale,
  dimensions,
  touchX,
  active,
  color,
  colors,
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
}) => {
  const referenceData = series[0]?.data ?? [];

  const snappedX = useDerivedValue(() => {
    const index = findActiveIndex(
      xScale,
      referenceData,
      touchX.value,
      active.value,
    );

    return index >= 0 ? xScale.toRange(referenceData[index].x) : touchX.value;
  }, [referenceData, xScale, touchX, active]);

  const verticalP1 = useDerivedValue(
    () => vec(snappedX.value, dimensions.padding.top),
    [snappedX, dimensions],
  );

  const verticalP2 = useDerivedValue(
    () => vec(snappedX.value, dimensions.height - dimensions.padding.bottom),
    [snappedX, dimensions],
  );

  const opacity = useDerivedValue(() => (active.value ? 1 : 0), [active]);

  const activeIndex = useAnimatedSyncedState(
    () => {
      "worklet";

      return findActiveIndex(xScale, referenceData, touchX.value, active.value);
    },
    [referenceData, xScale, touchX, active],
    -1,
  );

  const xLabelText =
    showXLabel && activeIndex >= 0
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
          color={resolveSeriesColor(item, index, colors)}
          xScale={xScale}
          yScale={yScale}
          touchX={touchX}
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
};
