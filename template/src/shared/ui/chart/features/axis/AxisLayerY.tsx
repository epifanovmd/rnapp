import { Group, Line, matchFont, Text, vec } from "@shopify/react-native-skia";
import React, { useMemo } from "react";

import { defaultLabelFormatter, useChartGeometry } from "../../core";
import type { AxisLayerBaseProps } from "./types";

export interface AxisLayerYProps extends AxisLayerBaseProps {
  /** С какой стороны рисовать: слева или справа. */
  position?: "left" | "right";
}

export const AxisLayerY = React.memo(
  ({
    visible = true,
    position = "left",
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
  }: AxisLayerYProps) => {
    const { yScale, dimensions } = useChartGeometry();
    const font = useMemo(
      () => matchFont({ fontFamily, fontSize }),
      [fontFamily, fontSize],
    );

    if (!visible || !font) {
      return null;
    }

    const isRight = position === "right";
    const axisX = isRight
      ? dimensions.width - dimensions.padding.right
      : dimensions.padding.left;
    const tickEndX = isRight ? axisX + tickLength : axisX - tickLength;

    return (
      <Group>
        {showAxisLine && (
          <Line
            p1={vec(axisX, dimensions.padding.top)}
            p2={vec(axisX, dimensions.height - dimensions.padding.bottom)}
            color={color}
            strokeWidth={lineWidth}
          />
        )}
        {yScale.ticks(tickCount).map((tick, index) => {
          const label = formatLabel(tick);
          const textWidth = font.measureText(label).width;
          const y = yScale.toRange(tick);
          const x = isRight ? axisX + 8 : axisX - textWidth - 8;

          return (
            <Group key={index}>
              {showTicks && (
                <Line
                  p1={vec(axisX, y)}
                  p2={vec(tickEndX, y)}
                  color={color}
                  strokeWidth={lineWidth}
                />
              )}
              <Text
                x={x}
                y={y + fontSize * 0.3}
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
