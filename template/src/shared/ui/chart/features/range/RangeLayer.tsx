import {
  Group,
  Line,
  matchFont,
  Rect,
  Text as SkiaText,
  vec,
} from "@shopify/react-native-skia";
import React, { useMemo, useState } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
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

const updateRangeStats = (
  data: { y: number }[],
  from: number,
  to: number,
  setter: React.Dispatch<React.SetStateAction<RangeStats | null>>,
) => {
  setter(computeStats(data, from, to));
};

export const RangeLayer: ChartLayerComponent<RangeLayerProps> = ({
  visible = true,
  fillColor = "rgba(59, 130, 246, 0.08)",
  strokeColor = "#3B82F6",
  strokeWidth: sw = 1,
  fontSize = 11,
  fontFamily = "System",
  textColor = "#FFFFFF",
  labelBackground = "rgba(15, 23, 42, 0.85)",
}) => {
  const { series, seriesShared } = useChartSeries();
  const { dimensions } = useChartGeometry();
  const { touchX, isActive, touchX2, isSecondActive } = useChartGesture();
  const { activeIndices, activeIndices2 } = useChartActiveIndices();

  const font = useMemo(
    () => matchFont({ fontFamily, fontSize }),
    [fontFamily, fontSize],
  );

  // Состояние подсветки диапазона и статистики.
  const [rangeRect, setRangeRect] = useState<{
    rect: { x: number; y: number; width: number; height: number };
    leftX: number;
    rightX: number;
  } | null>(null);
  const [stats, setStats] = useState<RangeStats | null>(null);
  const [isDualTouch, setIsDualTouch] = useState(false);

  useAnimatedReaction(
    () => isActive.value && isSecondActive.value,
    next => scheduleOnRN(setIsDualTouch, next),
    [isActive, isSecondActive],
  );

  useAnimatedReaction(
    () => {
      if (!isActive.value || !isSecondActive.value) return null;

      const x1 = touchX.value;
      const x2 = touchX2.value;
      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      const top = dimensions.padding.top;
      const bottom = dimensions.height - dimensions.padding.bottom;

      return {
        rect: { x: left, y: top, width: right - left, height: bottom - top },
        leftX: x1 < x2 ? x1 : x2,
        rightX: x1 < x2 ? x2 : x1,
      };
    },
    next => scheduleOnRN(setRangeRect, next),
    [isActive, isSecondActive, touchX, touchX2, dimensions],
  );

  useAnimatedReaction(
    () => {
      if (!isActive.value || !isSecondActive.value) return null;

      const i1 = activeIndices.value[0] ?? -1;
      const i2 = activeIndices2.value[0] ?? -1;

      return i1 >= 0 && i2 >= 0 ? [Math.min(i1, i2), Math.max(i1, i2)] : null;
    },
    next => {
      if (next) {
        const data = seriesShared.value[0]?.data;

        if (data) {
          scheduleOnRN(updateRangeStats, data, next[0], next[1], setStats);
        }
      }
    },
    [isActive, isSecondActive, activeIndices, activeIndices2, seriesShared],
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

  return (
    <Group>
      {rangeRect &&
        (() => {
          const r = rangeRect;

          return r ? (
            <>
              <Rect rect={r.rect} color={fillColor} />
              <Line
                p1={vec(r.leftX, dimensions.padding.top)}
                p2={vec(r.leftX, dimensions.height - dimensions.padding.bottom)}
                color={strokeColor}
                strokeWidth={sw}
              />
              <Line
                p1={vec(r.rightX, dimensions.padding.top)}
                p2={vec(
                  r.rightX,
                  dimensions.height - dimensions.padding.bottom,
                )}
                color={strokeColor}
                strokeWidth={sw}
              />
            </>
          ) : null;
        })()}
      {lines.length > 0 && isDualTouch && (
        <Group>
          <Rect
            rect={{
              x: dimensions.padding.left,
              y: dimensions.padding.top,
              width: Math.min(
                lines.reduce(
                  (w, l) => Math.max(w, font.measureText(l).width),
                  0,
                ) + 24,
                dimensions.width -
                  dimensions.padding.left -
                  dimensions.padding.right,
              ),
              height: lines.length * (fontSize + 6) + 12,
            }}
            color={labelBackground}
          />
          {lines.map((line, i) => {
            const y = dimensions.padding.top + 18 + i * (fontSize + 6);

            return (
              <SkiaText
                key={i}
                x={dimensions.padding.left + 12}
                y={y}
                text={line}
                font={font}
                color={textColor}
              />
            );
          })}
        </Group>
      )}
    </Group>
  );
};
