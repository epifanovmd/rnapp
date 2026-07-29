import { matchFont } from "@shopify/react-native-skia";
import React, { useMemo } from "react";

import {
  DASH_PRESETS,
  defaultLabelFormatter,
  useChartActiveIndices,
  useChartGeometry,
  useChartGesture,
  useChartSeries,
} from "../../core";
import { CrosshairLine } from "./CrosshairLine";
import type { CrosshairLayerProps } from "./types";

export const CrosshairLayer = React.memo(
  ({
    visible = true,
    color = "#94A3B8",
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
    showSecondTouch = true,
    secondLineColor,
  }: CrosshairLayerProps) => {
    const { series, geometry } = useChartSeries();
    const { xScale, dimensions } = useChartGeometry();
    const { touchX, isActive, touchX2, isSecondActive } = useChartGesture();
    const { activeIndices, activeIndices2 } = useChartActiveIndices();
    const intervals = dashArray ?? DASH_PRESETS[lineType];

    const font = useMemo(
      () => matchFont({ fontFamily: labelFontFamily, fontSize: labelFontSize }),
      [labelFontFamily, labelFontSize],
    );

    const secondColor = secondLineColor ?? color;

    const sharedLineProps = useMemo(
      () => ({
        series,
        dimensions,
        geometry,
        strokeWidth,
        markerRadius,
        showVerticalLine,
        showMarkers,
        showHorizontalLines,
        dashIntervals: intervals,
        showXLabel,
        xLabelPosition,
        xLabelFormatter,
        showYLabels,
        yLabelPosition,
        yLabelFormatter,
        font,
        fontSize: labelFontSize,
        labelBackground,
        labelTextColor,
      }),
      [
        series,
        dimensions,
        geometry,
        strokeWidth,
        markerRadius,
        showVerticalLine,
        showMarkers,
        showHorizontalLines,
        intervals,
        showXLabel,
        xLabelPosition,
        xLabelFormatter,
        showYLabels,
        yLabelPosition,
        yLabelFormatter,
        font,
        labelFontSize,
        labelBackground,
        labelTextColor,
      ],
    );

    if (!visible || !font) {
      return null;
    }

    return (
      <>
        <CrosshairLine
          {...sharedLineProps}
          touchX={touchX}
          active={isActive}
          activeIndices={activeIndices}
          color={color}
        />
        {showSecondTouch && (
          <CrosshairLine
            {...sharedLineProps}
            touchX={touchX2}
            active={isSecondActive}
            activeIndices={activeIndices2}
            color={secondColor}
          />
        )}
      </>
    );
  },
);
