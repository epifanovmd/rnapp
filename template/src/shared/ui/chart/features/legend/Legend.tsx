import React, { FC } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DEFAULT_SERIES_COLORS } from "../../core/default-series-colors";
import { resolveSeriesColor } from "../../core/resolve-series-color";
import type { IChartSeries } from "../../core/types";

export interface LegendProps {
  series: IChartSeries[];
  colors?: string[];
  textColor?: string;
  direction?: "row" | "column";
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
