import { DashPathEffect, Group, Line, vec } from "@shopify/react-native-skia";
import React from "react";

import { DASH_PRESETS, useChartGeometry } from "../../core";
import type { GridLayerProps } from "./types";

export const GridLayer = React.memo(
  ({
    visible = true,
    xTickCount = 5,
    yTickCount = 5,
    showXLines = true,
    showYLines = true,
    color = "#E2E8F0",
    strokeWidth = 1,
    lineType = "solid",
    dashArray,
  }: GridLayerProps) => {
    const { xScale, yScale, dimensions } = useChartGeometry();

    if (!visible) {
      return null;
    }

    const top = dimensions.padding.top;
    const bottom = dimensions.height - dimensions.padding.bottom;
    const left = dimensions.padding.left;
    const right = dimensions.width - dimensions.padding.right;
    const intervals = dashArray ?? DASH_PRESETS[lineType];

    return (
      <Group>
        {showYLines &&
          yScale.ticks(yTickCount).map((tick, index) => {
            const y = yScale.toRange(tick);

            return (
              <Line
                key={`y-${index}`}
                p1={vec(left, y)}
                p2={vec(right, y)}
                color={color}
                strokeWidth={strokeWidth}
              >
                {intervals && <DashPathEffect intervals={intervals} />}
              </Line>
            );
          })}
        {showXLines &&
          xScale.ticks(xTickCount).map((tick, index) => {
            const x = xScale.toRange(tick);

            return (
              <Line
                key={`x-${index}`}
                p1={vec(x, top)}
                p2={vec(x, bottom)}
                color={color}
                strokeWidth={strokeWidth}
              >
                {intervals && <DashPathEffect intervals={intervals} />}
              </Line>
            );
          })}
      </Group>
    );
  },
);
