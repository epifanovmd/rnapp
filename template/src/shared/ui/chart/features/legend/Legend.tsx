import React, { FC } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DEFAULT_SERIES_COLORS } from "../../core/default-series-colors";
import { resolveSeriesColor } from "../../core/resolve-series-color";
import type { IChartSeries } from "../../core/types";

export interface LegendProps {
  /** Тот же массив серий, что и у `<Chart>` — легенда не читает контекст графика, это отдельный компонент. */
  series: IChartSeries[];
  /** Цвета точек-маркеров по сериям (по кругу); переопределяется собственным `series.color`. */
  colors?: string[];
  /** Цвет текста подписей. */
  textColor?: string;
  /** Расположение элементов легенды. */
  direction?: "row" | "column";
  /** Срабатывает при нажатии на элемент легенды (например, для скрытия/показа серии). */
  onItemPress?: (series: IChartSeries) => void;
}

export const Legend: FC<LegendProps> = ({
  series,
  colors = DEFAULT_SERIES_COLORS,
  textColor = "#64748B",
  direction = "row",
  onItemPress,
}) => {
  return (
    <View style={[styles.container, direction === "column" && styles.column]}>
      {series.map((item, index) => (
        <Pressable
          key={item.id}
          style={styles.item}
          disabled={!onItemPress}
          onPress={onItemPress ? () => onItemPress(item) : undefined}
        >
          <View
            style={[
              styles.dot,
              { backgroundColor: resolveSeriesColor(item, index, colors) },
            ]}
          />
          <Text style={[styles.label, { color: textColor }]}>
            {item.label ?? item.id}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  column: {
    flexDirection: "column",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
  },
});
