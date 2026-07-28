import {
  Circle,
  DashPathEffect,
  Line,
  matchFont,
  RoundedRect,
  Text,
  vec,
} from "@shopify/react-native-skia";
import React, { useEffect, useMemo } from "react";
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useChartContext } from "../../core/chart-context";
import { LineDashType, resolveDashIntervals } from "../../core/dash-pattern";
import {
  LABEL_GAP,
  LABEL_PADDING_X,
  LABEL_PADDING_Y,
} from "../../core/label-style";
import { selectSeries, SeriesSelector } from "../../core/select-series";
import type { ChartLayerComponent } from "../../core/types";

export interface CurrentValueLineLayerProps extends SeriesSelector {
  /** Скрывает весь слой без размонтирования. */
  visible?: boolean;
  /** Цвет линии (и фона лейбла, если `labelBackground` не задан). */
  color?: string;
  /** Рисовать горизонтальную линию через текущее значение. `false` — только чип-лейбл. */
  showLine?: boolean;
  /** Толщина линии (px). */
  strokeWidth?: number;
  /** Сплошная, пунктирная или точечная линия. */
  lineType?: LineDashType;
  /** Свой паттерн штрихов (px); учитывается только если `lineType` не `"solid"`. */
  dashArray?: number[];
  /** Рисовать точку в последней точке данных серии (на конце графика). */
  showDot?: boolean;
  /** Радиус точки (px). */
  dotRadius?: number;
  /** Цвет заливки точки (по умолчанию — `color`). */
  dotColor?: string;
  /** Цвет обводки точки (без него обводка не рисуется). */
  dotStrokeColor?: string;
  /** Толщина обводки точки (px). */
  dotStrokeWidth?: number;
  /** Показывать чип со значением у края графика. */
  showLabel?: boolean;
  /** С какой стороны рисовать чип со значением. */
  labelPosition?: "left" | "right";
  /** Форматирует последнее значение серии для чипа. */
  formatLabel?: (value: number) => string;
  /** Размер шрифта чипа. */
  labelFontSize?: number;
  /** Шрифт чипа. */
  labelFontFamily?: string;
  /** Цвет фона чипа (по умолчанию — `color`). */
  labelBackground?: string;
  /** Цвет текста чипа. */
  labelTextColor?: string;
  /** Плавно анимировать линию/чип при изменении последнего значения (например, при live-обновлении данных). */
  animate?: boolean;
  /** Длительность анимации перехода (мс). */
  animationDuration?: number;
}

const defaultFormatLabel = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2);

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
  formatLabel = defaultFormatLabel,
  labelFontSize = 11,
  labelFontFamily = "System",
  labelBackground,
  labelTextColor = "#FFFFFF",
  animate = true,
  animationDuration = 250,
  ...selector
}) => {
  const { series, xScale, yScale, dimensions } = useChartContext();
  const resolvedSeries = selectSeries(series, selector)[0] ?? series[0];
  const data = resolvedSeries?.data ?? [];
  const lastDatum = data[data.length - 1];

  const intervals = resolveDashIntervals(lineType, dashArray);
  const font = useMemo(
    () => matchFont({ fontFamily: labelFontFamily, fontSize: labelFontSize }),
    [labelFontFamily, labelFontSize],
  );

  const left = dimensions.padding.left;
  const right = dimensions.width - dimensions.padding.right;
  const targetY = lastDatum ? yScale.toRange(lastDatum.y) : 0;
  const targetX = lastDatum ? xScale.toRange(lastDatum.x) : right;

  const animatedY = useSharedValue(targetY);
  const animatedX = useSharedValue(targetX);

  useEffect(() => {
    animatedY.value = animate
      ? withTiming(targetY, { duration: animationDuration })
      : targetY;
    animatedX.value = animate
      ? withTiming(targetX, { duration: animationDuration })
      : targetX;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetY, targetX, animate, animationDuration]);

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

  const text = lastDatum ? formatLabel(lastDatum.y) : "";
  const metrics = font ? font.measureText(text) : { width: 0 };
  const boxWidth = metrics.width + LABEL_PADDING_X * 2;
  const boxHeight = labelFontSize + LABEL_PADDING_Y * 2;
  const rawBoxX =
    labelPosition === "right" ? right + LABEL_GAP : left - boxWidth - LABEL_GAP;
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

  if (!visible || !lastDatum || !font) {
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

CurrentValueLineLayer.layerKind = "skia";
