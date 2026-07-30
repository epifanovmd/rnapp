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

export interface AxisLayerXProps extends AxisLayerBaseProps {
  position?: "top" | "bottom";
}

export const AxisLayerX = React.memo(
  ({
    visible = true,
    position = "bottom",
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
  }: AxisLayerXProps) => {
    const { xScale, dimensions } = useChartGeometry();
    const font = useMemo(
      () => matchFont({ fontFamily, fontSize }),
      [fontFamily, fontSize],
    );

    if (!visible || !font) return null;

    const isTop = position === "top";
    const pad = isTop ? dimensions.padding.top : dimensions.padding.bottom;
    const axisY = isTop ? pad : dimensions.height - pad;
    const bgH = fontSize + 14;

    // Позиция лейблов: наружу (в padding) или внутрь (в plot area)
    const isOut = labelSide === "out";

    const labelY = isTop
      ? isOut
        ? axisY - 6
        : axisY + fontSize + 6
      : isOut
        ? axisY + fontSize + 6
        : axisY - 6;

    const tickEndY = isTop
      ? isOut
        ? axisY - tickLength
        : axisY + tickLength
      : isOut
        ? axisY + tickLength
        : axisY - tickLength;

    const bgY = isTop
      ? isOut
        ? axisY - bgH
        : axisY
      : isOut
        ? axisY
        : axisY - bgH;

    const left = dimensions.padding.left;
    const right = dimensions.width - dimensions.padding.right;

    return (
      <Group>
        {background && (
          <Rect
            x={left}
            y={bgY}
            width={right - left}
            height={bgH}
            color={background}
          />
        )}
        {showAxisLine && (
          <Line
            p1={vec(left, axisY)}
            p2={vec(right, axisY)}
            color={color}
            strokeWidth={lineWidth}
          />
        )}
        {xScale.ticks(tickCount).map((tick, index) => {
          const label = formatLabel(tick);
          const textWidth = font.measureText(label).width;
          const tickX = xScale.toRange(tick);
          const x = isOut
            ? tickX
            : Math.min(
                Math.max(tickX, left + textWidth / 2 + 4),
                Math.max(right - textWidth / 2 - 4, left + textWidth / 2),
              );

          return (
            <Group key={index}>
              {showTicks && (
                <Line
                  p1={vec(tickX, axisY)}
                  p2={vec(tickX, tickEndY)}
                  color={color}
                  strokeWidth={lineWidth}
                />
              )}
              {labelBackground && (
                <RoundedRect
                  x={x - textWidth / 2 - 4}
                  y={
                    isTop
                      ? isOut
                        ? axisY - fontSize - 8
                        : axisY + 2
                      : isOut
                        ? axisY + 2
                        : axisY - fontSize - 8
                  }
                  width={textWidth + 8}
                  height={fontSize + 6}
                  r={3}
                  color={labelBackground}
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
