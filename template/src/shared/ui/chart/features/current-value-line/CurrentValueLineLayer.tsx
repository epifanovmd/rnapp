import {
  Circle,
  DashPathEffect,
  Group,
  Line,
  matchFont,
  RoundedRect,
  Text,
  vec,
} from "@shopify/react-native-skia";
import React, { useMemo, useState } from "react";
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { ChartLayerComponent } from "../../core";
import {
  DASH_PRESETS,
  defaultLabelFormatter,
  isInScaleRange,
  LABEL_GAP,
  LABEL_PADDING_X,
  LABEL_PADDING_Y,
  scaleToRange,
  selectSeries,
  useChartGeometry,
  useChartSeries,
} from "../../core";
import type { CurrentValueLineLayerProps } from "./types";

interface LastDatum {
  x: number;
  y: number;
}

export const CurrentValueLineLayer: ChartLayerComponent<
  CurrentValueLineLayerProps
> = ({
  visible = true,
  color = "#3B82F6",
  showLine = true,
  strokeWidth = 1,
  lineType = "dashed",
  dashArray,
  showDot = false,
  dotRadius = 4,
  dotColor,
  dotStrokeColor,
  dotStrokeWidth = 2,
  showLabel = true,
  labelPosition = "right",
  labelSide,
  formatLabel = defaultLabelFormatter,
  labelFontSize = 11,
  labelFontFamily = "System",
  labelBackground,
  labelTextColor = "#FFFFFF",
  animate = true,
  animationDuration = 250,
  seriesId,
}) => {
  const { seriesShared } = useChartSeries();
  const { xScale, yScale, dimensions, plot } = useChartGeometry();

  const intervals = dashArray ?? DASH_PRESETS[lineType];
  const font = useMemo(
    () => matchFont({ fontFamily: labelFontFamily, fontSize: labelFontSize }),
    [labelFontFamily, labelFontSize],
  );

  const left = plot.left;
  const right = plot.right;

  // Последняя точка серии считается на UI-потоке из `seriesShared` — компонент
  // не обязан re-render'иться на каждый live-тик, чтобы подвинуть линию/точку.
  const lastDatum = useDerivedValue<LastDatum | null>(() => {
    const matched = selectSeries(seriesShared.value, seriesId);
    const item = matched[0] ?? seriesShared.value[0];
    const data = item?.data ?? [];
    const last = data[data.length - 1];

    return last ? { x: last.x, y: last.y } : null;
  }, [seriesShared, seriesId]);

  // Анимируется значение в домене, а не пиксель: при прокрутке и зуме линия
  // идёт за шкалой без запаздывания, а анимация — только на смену значения.
  const animatedX = useSharedValue(NaN);
  const animatedY = useSharedValue(NaN);

  // Мостик в JS только для текста чипа — и только при смене значения.
  const [lastValue, setLastValue] = useState<number | null>(
    () => lastDatum.value?.y ?? null,
  );

  useAnimatedReaction(
    () => lastDatum.value,
    (next, previous) => {
      if (!next) {
        return;
      }

      if (!previous || !animate || !Number.isFinite(animatedY.value)) {
        animatedX.value = next.x;
        animatedY.value = next.y;
      } else {
        if (next.x !== previous.x) {
          animatedX.value = withTiming(next.x, {
            duration: animationDuration,
          });
        }
        if (next.y !== previous.y) {
          animatedY.value = withTiming(next.y, {
            duration: animationDuration,
          });
        }
      }
      if (!previous || next.y !== previous.y) {
        scheduleOnRN(setLastValue, next.y);
      }
    },
    [lastDatum, animate, animationDuration],
  );

  const pixelY = useDerivedValue(
    () => scaleToRange(yScale.value, animatedY.value),
    [yScale, animatedY],
  );
  const pixelX = useDerivedValue(
    () => scaleToRange(xScale.value, animatedX.value),
    [xScale, animatedX],
  );

  const p1 = useDerivedValue(() => vec(left, pixelY.value), [pixelY, left]);
  const p2 = useDerivedValue(() => vec(right, pixelY.value), [pixelY, right]);
  const dotCenter = useDerivedValue(
    () => vec(pixelX.value, pixelY.value),
    [pixelX, pixelY],
  );
  // Последняя точка за краем окна (окно в прошлом) — без точки.
  const dotOpacity = useDerivedValue(
    () => (isInScaleRange(xScale.value, pixelX.value, 1) ? 1 : 0),
    [xScale, pixelX],
  );

  const text = lastValue !== null ? formatLabel(lastValue) : "";
  const metrics = font ? font.measureText(text) : { width: 0 };
  const boxWidth = metrics.width + LABEL_PADDING_X * 2;
  const boxHeight = labelFontSize + LABEL_PADDING_Y * 2;
  const isIn = labelSide === "in";
  const rawBoxX =
    labelPosition === "right"
      ? isIn
        ? right - boxWidth - LABEL_GAP
        : right + LABEL_GAP
      : isIn
        ? left + LABEL_GAP
        : left - boxWidth - LABEL_GAP;
  const boxX = Math.min(
    Math.max(rawBoxX, 0),
    Math.max(dimensions.width - boxWidth, 0),
  );

  const boxY = useDerivedValue(
    () => pixelY.value - boxHeight / 2,
    [pixelY, boxHeight],
  );
  const textY = useDerivedValue(
    () => pixelY.value + labelFontSize * 0.3,
    [pixelY, labelFontSize],
  );

  if (!visible || lastValue === null || !font) {
    return null;
  }

  return (
    <>
      {showLine && (
        <Line p1={p1} p2={p2} color={color} strokeWidth={strokeWidth}>
          {intervals && <DashPathEffect intervals={intervals} />}
        </Line>
      )}
      {showDot && (
        <Group opacity={dotOpacity}>
          <Circle c={dotCenter} r={dotRadius} color={dotColor ?? color} />
          {dotStrokeColor && (
            <Circle
              c={dotCenter}
              r={dotRadius}
              style="stroke"
              strokeWidth={dotStrokeWidth}
              color={dotStrokeColor}
            />
          )}
        </Group>
      )}
      {showLabel && (
        <>
          <RoundedRect
            x={boxX}
            y={boxY}
            width={boxWidth}
            height={boxHeight}
            r={4}
            color={labelBackground ?? color}
          />
          <Text
            x={boxX + LABEL_PADDING_X}
            y={textY}
            text={text}
            font={font}
            color={labelTextColor}
          />
        </>
      )}
    </>
  );
};
