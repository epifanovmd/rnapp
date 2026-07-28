import React, { FC } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ActiveTooltipPoint } from "./types";

export interface TooltipContentProps {
  points: ActiveTooltipPoint[];
  backgroundColor?: string;
  textColor?: string;
}

export const TooltipContent: FC<TooltipContentProps> = ({
  points,
  backgroundColor = "rgba(15, 23, 42, 0.92)",
  textColor = "#FFFFFF",
}) => {
  if (points.length === 0) {
    return null;
  }

  return (
    <View style={[styles.box, { backgroundColor }]}>
      {points.map(point => (
        <View key={point.series.id} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: point.color }]} />
          <Text style={[styles.label, { color: textColor }]}>
            {`${point.series.label ?? point.series.id}: `}
            <Text style={styles.value}>
              {point.datum.label ?? point.datum.y}
            </Text>
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
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
  value: {
    fontWeight: "700",
  },
});
