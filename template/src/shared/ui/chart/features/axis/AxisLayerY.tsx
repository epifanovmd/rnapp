import {
  Group,
  Line,
  matchFont,
  Rect,
  RoundedRect,
  Text,
  vec,
} from "@shopify/react-native-skia";
import React, { useMemo } from "react";

import { defaultLabelFormatter, useChartGeometry } from "../../core";
import type { AxisLayerBaseProps } from "./types";

export interface AxisLayerYProps extends AxisLayerBaseProps {
  position?: "left" | "right";
}

export const AxisLayerY = React.memo(
  ({
    visible = true,
    position = "left",
    labelSide = "out",
    tickCount = 5,
    formatLabel = defaultLabelFormatter,
    color = "#94A3B8",
    showAxisLine = true,
    lineWidth = 1,
    labelColor = "#64748B",
    fontSize = 11,
    fontFamily = "System",
    showTicks = true,
    tickLength = 4,
    labelBackground,
    background,
  }: AxisLayerYProps) => {
    const { yScale, dimensions } = useChartGeometry();
    const font = useMemo(
      () => matchFont({ fontFamily, fontSize }),
      [fontFamily, fontSize],
    );

    if (!visible || !font) return null;

    const isRight = position === "right";
    const pad = isRight ? dimensions.padding.right : dimensions.padding.left;
    const axisX = isRight ? dimensions.width - pad : pad;
    const isOut = labelSide === "out";

    const tickEndX = isRight
      ? isOut
        ? axisX + tickLength
        : axisX - tickLength
      : isOut
        ? axisX - tickLength
        : axisX + tickLength;

    const ticks = yScale.ticks(tickCount);
    const tickLabels = ticks.map(tick => formatLabel(tick));
    const labelWidths = tickLabels.map(text => font.measureText(text).width);
    const maxLabelWidth = labelWidths.reduce((a, b) => Math.max(a, b), 0);
    const bgW = maxLabelWidth + 16;

    const bgX = isRight
      ? isOut
        ? axisX
        : axisX - bgW
      : isOut
        ? axisX - bgW
        : axisX;

    return (
      <Group>
        {background && (
          <Rect
            x={bgX}
            y={dimensions.padding.top}
            width={bgW}
            height={
              dimensions.height -
              dimensions.padding.top -
              dimensions.padding.bottom
            }
            color={background}
          />
        )}
        {showAxisLine && (
          <Line
            p1={vec(axisX, dimensions.padding.top)}
            p2={vec(axisX, dimensions.height - dimensions.padding.bottom)}
            color={color}
            strokeWidth={lineWidth}
          />
        )}
        {ticks.map((tick, index) => {
          const label = tickLabels[index];
          const textWidth = labelWidths[index];
          const y = yScale.toRange(tick);

          const x = isRight
            ? isOut
              ? axisX + 8
              : axisX - textWidth - 6
            : isOut
              ? axisX - textWidth - 8
              : axisX + 6;

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
              {labelBackground && (
                <RoundedRect
                  x={
                    isRight
                      ? isOut
                        ? axisX + 4
                        : axisX - textWidth - 10
                      : isOut
                        ? axisX - textWidth - 12
                        : axisX + 2
                  }
                  y={y - fontSize / 2 - 3}
                  width={textWidth + 8}
                  height={fontSize + 6}
                  r={3}
                  color={labelBackground}
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
