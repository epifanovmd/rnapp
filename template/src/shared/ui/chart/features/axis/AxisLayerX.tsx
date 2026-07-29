import { Group, Line, matchFont, Text, vec } from "@shopify/react-native-skia";
import React, { useMemo } from "react";

import { defaultLabelFormatter, useChartGeometry } from "../../core";
import type { AxisLayerBaseProps } from "./types";

export interface AxisLayerXProps extends AxisLayerBaseProps {
  position?: "top" | "bottom";
}

export const AxisLayerX = React.memo(
  ({
    visible = true,
    position = "bottom",
    tickCount = 5,
    formatLabel = defaultLabelFormatter,
    color = "#94A3B8",
    showAxisLine = true,
    lineWidth = 1,
    labelColor = "#64748B",
    fontSize = 11,
    fontFamily = "System",
    showTicks = false,
    tickLength = 4,
  }: AxisLayerXProps) => {
    const { xScale, dimensions } = useChartGeometry();
    const font = useMemo(
      () => matchFont({ fontFamily, fontSize }),
      [fontFamily, fontSize],
    );

    if (!visible || !font) {
      return null;
    }

    const isTop = position === "top";
    const axisY = isTop
      ? dimensions.padding.top
      : dimensions.height - dimensions.padding.bottom;
    const tickEndY = isTop ? axisY - tickLength : axisY + tickLength;
    const labelY = isTop ? axisY - 6 : axisY + fontSize + 6;

    return (
      <Group>
        {showAxisLine && (
          <Line
            p1={vec(dimensions.padding.left, axisY)}
            p2={vec(dimensions.width - dimensions.padding.right, axisY)}
            color={color}
            strokeWidth={lineWidth}
          />
        )}
        {xScale.ticks(tickCount).map((tick, index) => {
          const label = formatLabel(tick);
          const textWidth = font.measureText(label).width;
          const x = xScale.toRange(tick);

          return (
            <Group key={index}>
              {showTicks && (
                <Line
                  p1={vec(x, axisY)}
                  p2={vec(x, tickEndY)}
                  color={color}
                  strokeWidth={lineWidth}
                />
              )}
              <Text
                x={x - textWidth / 2}
                y={labelY}
                text={label}
                font={font}
                color={labelColor}
              />
            </Group>
          );
        })}
      </Group>
    );
  },
);
