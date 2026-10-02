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
import { useAxisLabels } from "./useAxisLabels";

export interface AxisLayerYProps extends AxisLayerBaseProps {
  position?: "left" | "right";
}

/** Доля высоты домена, на которую деления строятся за каждым краем. */
const LABEL_EXTEND = 0.5;

/** Ось Y: деления следуют за доменом (в т.ч. его анимацией) на UI-потоке. */
export const AxisLayerY = React.memo(
  ({
    visible = true,
    position = "left",
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
  }: AxisLayerYProps) => {
    const { yScale, plot } = useChartGeometry();
    const font = useMemo(
      () => matchFont({ fontFamily, fontSize }),
      [fontFamily, fontSize],
    );
    const format =
      formatLabel ?? (mode === "time" ? formatTimeTick : defaultLabelFormatter);

    const ticks = useAxisTicks(yScale, mode, tickCount, LABEL_EXTEND);
    const labels = useAxisLabels(ticks, format, font);
    const slotCount = mode === "divide" ? tickCount + 1 : tickCount * 2 + 4;

    const isRight = position === "right";
    const isOut = labelSide === "out";
    const axisX = isRight ? plot.right : plot.left;

    const tickEndX = isRight
      ? isOut
        ? axisX + tickLength
        : axisX - tickLength
      : isOut
        ? axisX - tickLength
        : axisX + tickLength;

    const place = useCallback(
      (pixel: number, width: number) => {
        "worklet";

        const x = isRight
          ? isOut
            ? axisX + 8
            : axisX - width - 6
          : isOut
            ? axisX - width - 8
            : axisX + 6;

        return { x, y: pixel + fontSize * 0.3 };
      },
      [isRight, isOut, axisX, fontSize],
    );

    const tickPath = useDerivedValue(() => {
      const builder = Skia.PathBuilder.Make();
      const scale = yScale.value;

      for (const value of ticks.value.values) {
        const y = scaleToRange(scale, value);

        if (isInScaleRange(scale, y, 0.5)) {
          builder.moveTo(axisX, y);
          builder.lineTo(tickEndX, y);
        }
      }

      return builder.detach();
    }, [yScale, ticks, axisX, tickEndX]);

    // Фон — по самой широкой подписи.
    const backgroundWidth = useDerivedValue(
      () => labels.value.widths.reduce((max, w) => Math.max(max, w), 0) + 16,
      [labels],
    );
    const backgroundX = useDerivedValue(() => {
      const width = backgroundWidth.value;

      return isRight
        ? isOut
          ? axisX
          : axisX - width
        : isOut
          ? axisX - width
          : axisX;
    }, [backgroundWidth, isRight, isOut, axisX]);

    if (!visible || !font) return null;

    return (
      <Group>
        {background && (
          <Rect
            x={backgroundX}
            y={plot.top}
            width={backgroundWidth}
            height={plot.height}
            color={background}
          />
        )}
        {showAxisLine && (
          <Line
            p1={vec(axisX, plot.top)}
            p2={vec(axisX, plot.bottom)}
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
            scale={yScale}
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
