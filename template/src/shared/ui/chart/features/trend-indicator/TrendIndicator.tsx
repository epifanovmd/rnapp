import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useChartContext } from "../../core/chart-context";
import {
  computeTrend,
  resolveTrendColor,
  TrendCompareMode,
} from "../../core/compute-trend";
import { selectSeries, SeriesSelector } from "../../core/select-series";
import type { ChartLayerComponent } from "../../core/types";

export type TrendPosition =
  "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface TrendIndicatorProps extends SeriesSelector {
  /** Скрывает индикатор без размонтирования. */
  visible?: boolean;
  /** С чем сравнивать последнее значение: с первой точкой серии или с предыдущей (последний тик). */
  compare?: TrendCompareMode;
  /** В каком углу графика показывать бейдж. */
  position?: TrendPosition;
  /** Отступ бейджа от края рабочей области (px). */
  offset?: number;
  /** Число знаков после запятой у процента изменения. */
  precision?: number;
  /** Показывать стрелку (▲/▼) перед значением. */
  showArrow?: boolean;
  /** Цвет текста/стрелки при росте. */
  upColor?: string;
  /** Цвет текста/стрелки при падении. */
  downColor?: string;
  /** Цвет текста/стрелки при отсутствии изменения. */
  neutralColor?: string;
  /** Цвет фона бейджа (без него — фон прозрачный, только текст). */
  backgroundColor?: string;
  /** Размер шрифта. */
  fontSize?: number;
  /** Полностью заменяет дефолтный текст бейджа своим форматированием. */
  formatValue?: (change: number, percent: number) => string;
}

export const TrendIndicator: ChartLayerComponent<TrendIndicatorProps> = ({
  visible = true,
  compare = "previous",
  position = "top-right",
  offset = 8,
  precision = 1,
  showArrow = true,
  upColor = "#10B981",
  downColor = "#EF4444",
  neutralColor = "#94A3B8",
  backgroundColor,
  fontSize = 12,
  formatValue,
  ...selector
}) => {
  const { series, dimensions } = useChartContext();

  const { seriesId, seriesIds } = selector;

  const trend = useMemo(() => {
    const resolvedSeries =
      selectSeries(series, { seriesId, seriesIds })[0] ?? series[0];
    const data = resolvedSeries?.data ?? [];

    return computeTrend(data, compare);
  }, [series, seriesId, seriesIds, compare]);

  if (!visible || !trend) {
    return null;
  }

  const { direction } = trend;
  const color = resolveTrendColor(direction, upColor, downColor, neutralColor);
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "–";
  const sign = trend.percent > 0 ? "+" : "";
  const text = formatValue
    ? formatValue(trend.change, trend.percent)
    : `${showArrow ? `${arrow} ` : ""}${sign}${trend.percent.toFixed(precision)}%`;

  const positionStyle = {
    top: position.startsWith("top")
      ? dimensions.padding.top + offset
      : undefined,
    bottom: position.startsWith("bottom")
      ? dimensions.padding.bottom + offset
      : undefined,
    left: position.endsWith("left")
      ? dimensions.padding.left + offset
      : undefined,
    right: position.endsWith("right")
      ? dimensions.padding.right + offset
      : undefined,
  };

  return (
    <View
      style={[
        styles.container,
        positionStyle,
        backgroundColor ? { backgroundColor } : null,
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.text, { color, fontSize }]}>{text}</Text>
    </View>
  );
};

TrendIndicator.layerKind = "overlay";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontWeight: "600",
  },
});
