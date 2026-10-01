import {
  Group,
  Line,
  matchFont,
  Rect,
  Text as SkiaText,
  vec,
} from "@shopify/react-native-skia";
import React, { useMemo, useState } from "react";
import { useAnimatedReaction, useDerivedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { ChartLayerComponent } from "../../core";
import {
  useChartActiveIndices,
  useChartGeometry,
  useChartGesture,
  useChartSeries,
} from "../../core";
import type { RangeLayerProps } from "./types";

interface RangeStats {
  left: number;
  right: number;
  delta: number;
  deltaPct: number;
  min: number;
  max: number;
  avg: number;
}

const computeStats = (
  data: { y: number }[],
  from: number,
  to: number,
): RangeStats | null => {
  if (from < 0 || to >= data.length || from >= to) return null;

  const slice = data.slice(from, to + 1);
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (const d of slice) {
    if (d.y < min) min = d.y;
    if (d.y > max) max = d.y;
    sum += d.y;
  }

  const first = data[from].y;
  const last = data[to].y;

  return {
    left: from,
    right: to,
    delta: last - first,
    deltaPct: first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0,
    min,
    max,
    avg: Math.round(sum / slice.length),
  };
};

const sameRange = (a: number[] | null, b: number[] | null | undefined) =>
  a === b || (!!a && !!b && a[0] === b[0] && a[1] === b[1]);

export const RangeLayer: ChartLayerComponent<RangeLayerProps> = ({
  visible = true,
  placement = "top-right",
  fillColor = "rgba(59, 130, 246, 0.08)",
  strokeColor = "#3B82F6",
  strokeWidth: sw = 1,
  fontSize = 11,
  fontFamily = "System",
  textColor = "#FFFFFF",
  labelBackground = "rgba(15, 23, 42, 0.85)",
}) => {
  const { series } = useChartSeries();
  const { dimensions } = useChartGeometry();
  const { touchX, isActive, touchX2, isSecondActive } = useChartGesture();
  const { activeIndices, activeIndices2 } = useChartActiveIndices();

  const font = useMemo(
    () => matchFont({ fontFamily, fontSize }),
    [fontFamily, fontSize],
  );

  const [range, setRange] = useState<number[] | null>(null);

  const top = dimensions.padding.top;
  const bottom = dimensions.height - dimensions.padding.bottom;

  const opacity = useDerivedValue(
    () => (isActive.value && isSecondActive.value ? 1 : 0),
    [isActive, isSecondActive],
  );
  const leftX = useDerivedValue(
    () => Math.min(touchX.value, touchX2.value),
    [touchX, touchX2],
  );
  const rightX = useDerivedValue(
    () => Math.max(touchX.value, touchX2.value),
    [touchX, touchX2],
  );
  const rectWidth = useDerivedValue(
    () => rightX.value - leftX.value,
    [leftX, rightX],
  );
  const leftP1 = useDerivedValue(() => vec(leftX.value, top), [leftX, top]);
  const leftP2 = useDerivedValue(
    () => vec(leftX.value, bottom),
    [leftX, bottom],
  );
  const rightP1 = useDerivedValue(() => vec(rightX.value, top), [rightX, top]);
  const rightP2 = useDerivedValue(
    () => vec(rightX.value, bottom),
    [rightX, bottom],
  );

  useAnimatedReaction(
    () => {
      if (!isActive.value || !isSecondActive.value) return null;

      const i1 = activeIndices.value[0] ?? -1;
      const i2 = activeIndices2.value[0] ?? -1;

      return i1 >= 0 && i2 >= 0 ? [Math.min(i1, i2), Math.max(i1, i2)] : null;
    },
    (next, previous) => {
      if (!sameRange(next, previous)) {
        scheduleOnRN(setRange, next);
      }
    },
    [isActive, isSecondActive, activeIndices, activeIndices2],
  );

  const stats = useMemo(
    () =>
      range ? computeStats(series[0]?.data ?? [], range[0], range[1]) : null,
    [range, series],
  );

  const lines = useMemo(() => {
    if (!stats) return [];

    const delta = stats.delta >= 0 ? `+${stats.delta}` : `${stats.delta}`;
    const pct =
      stats.deltaPct >= 0
        ? `+${stats.deltaPct.toFixed(1)}%`
        : `${stats.deltaPct.toFixed(1)}%`;

    return [
      `Диапазон: ${stats.left} – ${stats.right}`,
      `Δ: ${delta} (${pct})`,
      `Min: ${stats.min}  Max: ${stats.max}  Avg: ${stats.avg}`,
    ];
  }, [stats]);

  if (!visible || !font) return null;

  const plotWidth =
    dimensions.width - dimensions.padding.left - dimensions.padding.right;
  const statsWidth = Math.min(
    lines.reduce((w, l) => Math.max(w, font.measureText(l).width), 0) + 24,
    plotWidth,
  );
  const statsX =
    placement === "top-left"
      ? dimensions.padding.left
      : dimensions.width - dimensions.padding.right - statsWidth;

  return (
    <Group opacity={opacity}>
      <Rect
        x={leftX}
        y={top}
        width={rectWidth}
        height={bottom - top}
        color={fillColor}
      />
      <Line p1={leftP1} p2={leftP2} color={strokeColor} strokeWidth={sw} />
      <Line p1={rightP1} p2={rightP2} color={strokeColor} strokeWidth={sw} />
      {lines.length > 0 && (
        <Group>
          <Rect
            x={statsX}
            y={top}
            width={statsWidth}
            height={lines.length * (fontSize + 6) + 12}
            color={labelBackground}
          />
          {lines.map((line, i) => (
            <SkiaText
              key={i}
              x={statsX + 12}
              y={top + 18 + i * (fontSize + 6)}
              text={line}
              font={font}
              color={textColor}
            />
          ))}
        </Group>
      )}
    </Group>
  );
};
