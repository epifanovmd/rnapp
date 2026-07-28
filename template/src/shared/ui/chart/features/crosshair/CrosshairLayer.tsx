import {
  DashPathEffect,
  Group,
  Line,
  matchFont,
  vec,
} from "@shopify/react-native-skia";
import React, { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { useChartContext } from "../../core/chart-context";
import { LineDashType, resolveDashIntervals } from "../../core/dash-pattern";
import { DEFAULT_SERIES_COLORS } from "../../core/default-series-colors";
import { findActiveIndex } from "../../core/interaction/nearest-point";
import { useAnimatedSyncedState } from "../../core/interaction/useAnimatedSyncedState";
import { resolveSeriesColor } from "../../core/resolve-series-color";
import type { ChartLayerComponent, IChartSeries } from "../../core/types";
import { CrosshairSeriesIndicator } from "./CrosshairSeriesIndicator";
import { CrosshairXLabel } from "./CrosshairXLabel";
import { defaultLabelFormatter } from "./label-style";

export interface CrosshairLayerProps {
  visible?: boolean;
  color?: string;
  colors?: string[];
  strokeWidth?: number;
  markerRadius?: number;
  showMarkers?: boolean;
  showVerticalLine?: boolean;
  showHorizontalLines?: boolean;
  lineType?: LineDashType;
  dashArray?: number[];
  showXLabel?: boolean;
  xLabelPosition?: "top" | "bottom";
  xLabelFormatter?: (value: number) => string;
  showYLabels?: boolean;
  yLabelPosition?: "left" | "right";
  yLabelFormatter?: (value: number, series: IChartSeries) => string;
  labelFontSize?: number;
  labelFontFamily?: string;
  labelBackground?: string;
  labelTextColor?: string;
}

export const CrosshairLayer: ChartLayerComponent<CrosshairLayerProps> = ({
  visible = true,
  color = "#94A3B8",
  colors = DEFAULT_SERIES_COLORS,
  strokeWidth = 1,
  markerRadius = 5,
  showMarkers = true,
  showVerticalLine = true,
  showHorizontalLines = true,
  lineType = "solid",
  dashArray,
  showXLabel = false,
  xLabelPosition = "bottom",
  xLabelFormatter = defaultLabelFormatter,
  showYLabels = false,
  yLabelPosition = "left",
  yLabelFormatter = defaultLabelFormatter,
  labelFontSize = 11,
  labelFontFamily = "System",
  labelBackground = "rgba(15, 23, 42, 0.92)",
  labelTextColor = "#FFFFFF",
}) => {
  const { series, xScale, yScale, dimensions, interaction } = useChartContext();
  const { touchX, isActive } = interaction;
  const referenceData = series[0]?.data ?? [];
  const intervals = resolveDashIntervals(lineType, dashArray);

  const font = useMemo(
    () => matchFont({ fontFamily: labelFontFamily, fontSize: labelFontSize }),
    [labelFontFamily, labelFontSize],
  );

  const snappedX = useDerivedValue(() => {
    const index = findActiveIndex(
      xScale,
      referenceData,
      touchX.value,
      isActive.value,
    );

    return index >= 0 ? xScale.toRange(referenceData[index].x) : touchX.value;
  }, [referenceData, xScale, touchX, isActive]);

  const verticalP1 = useDerivedValue(
    () => vec(snappedX.value, dimensions.padding.top),
    [snappedX, dimensions],
  );

  const verticalP2 = useDerivedValue(
    () => vec(snappedX.value, dimensions.height - dimensions.padding.bottom),
    [snappedX, dimensions],
  );

  const opacity = useDerivedValue(() => (isActive.value ? 1 : 0), [isActive]);

  const activeXIndex = useAnimatedSyncedState(
    () => {
      "worklet";

      return findActiveIndex(
        xScale,
        referenceData,
        touchX.value,
        isActive.value,
      );
    },
    [referenceData, xScale, touchX, isActive],
    -1,
  );

  const xLabelText =
    showXLabel && activeXIndex >= 0
      ? xLabelFormatter(referenceData[activeXIndex].x)
      : "";

  if (!visible || !font) {
    return null;
  }

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
          {intervals && <DashPathEffect intervals={intervals} />}
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
          dashIntervals={intervals}
          left={left}
          right={right}
          canvasWidth={dimensions.width}
          showMarker={showMarkers}
          showHorizontalLine={showHorizontalLines}
          showLabel={showYLabels}
          labelPosition={yLabelPosition}
          labelFormatter={yLabelFormatter}
          font={font}
          fontSize={labelFontSize}
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
          fontSize={labelFontSize}
          background={labelBackground}
          textColor={labelTextColor}
        />
      )}
    </Group>
  );
};

CrosshairLayer.layerKind = "skia";
