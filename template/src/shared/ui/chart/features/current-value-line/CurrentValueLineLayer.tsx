import {
  Circle,
  DashPathEffect,
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
  LABEL_GAP,
  LABEL_PADDING_X,
  LABEL_PADDING_Y,
  selectSeries,
  useChartGeometry,
  useChartSeries,
} from "../../core";
import type { CurrentValueLineLayerProps } from "./types";

interface LastPoint {
  x: number;
  y: number;
  rawY: number;
}

const arePointsEqual = (a: LastPoint | null, b: LastPoint | null): boolean => {
  "worklet";

  return a === b || (a !== null && b !== null && a.rawY === b.rawY);
};

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
  const { xScale, yScale, dimensions } = useChartGeometry();

  const intervals = dashArray ?? DASH_PRESETS[lineType];
  const font = useMemo(
    () => matchFont({ fontFamily: labelFontFamily, fontSize: labelFontSize }),
    [labelFontFamily, labelFontSize],
  );

  const left = dimensions.padding.left;
  const right = dimensions.width - dimensions.padding.right;

  // Последняя точка серии считается на UI-потоке из `seriesShared` — компонент
  // не обязан re-render'иться на каждый live-тик, чтобы просто подвинуть линию/точку.
  const lastPointDerived = useDerivedValue<LastPoint | null>(() => {
    const matched = selectSeries(seriesShared.value, seriesId);
    const item = matched[0] ?? seriesShared.value[0];
    const data = item?.data ?? [];
    const last = data[data.length - 1];

    if (!last) {
      return null;
    }

    return {
      x: xScale.toRange(last.x),
      y: yScale.toRange(last.y),
      rawY: last.y,
    };
  }, [seriesShared, xScale, yScale, seriesId]);

  const animatedY = useSharedValue(0);
  const animatedX = useSharedValue(0);

  // Мостик в JS только для текста чипа (форматирование/измерение шрифта) — и
  // только когда значение реально изменилось, а не на любое обновление серий.
  const [lastPoint, setLastPoint] = useState<LastPoint | null>(
    () => lastPointDerived.value,
  );

  useAnimatedReaction(
    () => lastPointDerived.value,
    (next, previous) => {
      if (!next) {
        return;
      }

      if (previous === null || !animate) {
        animatedX.value = next.x;
        animatedY.value = next.y;
      } else {
        animatedX.value = withTiming(next.x, { duration: animationDuration });
        animatedY.value = withTiming(next.y, { duration: animationDuration });
      }
      if (previous === null || !arePointsEqual(next, previous)) {
        scheduleOnRN(setLastPoint, next);
      }
    },
    [lastPointDerived, animate, animationDuration],
  );

  const p1 = useDerivedValue(
    () => vec(left, animatedY.value),
    [animatedY, left],
  );
  const p2 = useDerivedValue(
    () => vec(right, animatedY.value),
    [animatedY, right],
  );
  const dotCenter = useDerivedValue(
    () => vec(animatedX.value, animatedY.value),
    [animatedX, animatedY],
  );

  const text = lastPoint ? formatLabel(lastPoint.rawY) : "";
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
    () => animatedY.value - boxHeight / 2,
    [animatedY, boxHeight],
  );
  const textY = useDerivedValue(
    () => animatedY.value + labelFontSize * 0.3,
    [animatedY, labelFontSize],
  );

  if (!visible || !lastPoint || !font) {
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
        <>
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
        </>
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
