import {
  Group,
  Line,
  matchFont,
  Path,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import React, { useCallback, useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import {
  defaultLabelFormatter,
  formatTimeTick,
  isInScaleRange,
  scaleToRange,
  useAxisTicks,
  useChartGeometry,
} from "../../core";
import { AxisLabelSlot } from "./AxisLabelSlot";
import type { AxisLayerBaseProps } from "./types";
import { AxisLabelFormatter, useAxisLabels } from "./useAxisLabels";

export interface AxisLayerXProps extends AxisLayerBaseProps {
  position?: "top" | "bottom";
}

/** Доля ширины окна, на которую деления строятся за каждым краем. */
const LABEL_EXTEND = 0.5;

/** Ось X: деления следуют за окном на UI-потоке, подписи — из пула слотов. */
export const AxisLayerX = React.memo(
  ({
    visible = true,
    position = "bottom",
    labelSide = "out",
    tickCount = 5,
    ticks: mode = "nice",
    formatLabel,
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
    const { xScale, plot } = useChartGeometry();
    const font = useMemo(
      () => matchFont({ fontFamily, fontSize }),
      [fontFamily, fontSize],
    );
    const format = useMemo<AxisLabelFormatter>(
      () =>
        formatLabel ??
        (mode === "time"
          ? (value, tick) => formatTimeTick(value, tick.unit ?? undefined)
          : defaultLabelFormatter),
      [formatLabel, mode],
    );

    const ticks = useAxisTicks(xScale, mode, tickCount, LABEL_EXTEND);
    const labels = useAxisLabels(ticks, format, font);
    const slotCount = tickCount * 2 + 4;

    const isTop = position === "top";
    const isOut = labelSide === "out";
    const axisY = isTop ? plot.top : plot.bottom;
    const left = plot.left;
    const right = plot.right;

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

    const bgH = fontSize + 14;
    const bgY = isTop
      ? isOut
        ? axisY - bgH
        : axisY
      : isOut
        ? axisY
        : axisY - bgH;

    // Внутри графика подпись прижимается к краям области построения.
    const place = useCallback(
      (pixel: number, width: number) => {
        "worklet";

        const x = isOut
          ? pixel
          : Math.min(
              Math.max(pixel, left + width / 2 + 4),
              Math.max(right - width / 2 - 4, left + width / 2),
            );

        return { x: x - width / 2, y: labelY };
      },
      [isOut, left, right, labelY],
    );

    const tickPath = useDerivedValue(() => {
      const builder = Skia.PathBuilder.Make();
      const scale = xScale.value;

      for (const value of ticks.value.values) {
        const x = scaleToRange(scale, value);

        if (isInScaleRange(scale, x, 0.5)) {
          builder.moveTo(x, axisY);
          builder.lineTo(x, tickEndY);
        }
      }

      return builder.detach();
    }, [xScale, ticks, axisY, tickEndY]);

    if (!visible || !font) return null;

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
        {showTicks && (
          <Path
            path={tickPath}
            style={"stroke"}
            color={color}
            strokeWidth={lineWidth}
          />
        )}
        {Array.from({ length: slotCount }, (_, index) => (
          <AxisLabelSlot
            key={index}
            index={index}
            labels={labels}
            scale={xScale}
            place={place}
            font={font}
            fontSize={fontSize}
            color={labelColor}
            background={labelBackground}
          />
        ))}
      </Group>
    );
  },
);
