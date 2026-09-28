import { useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";

import type { ICalendarMarkerProps } from "../calendar.types";
import { useCalendarConfig } from "../context";

export const MARKER_SIZE = 6;
/** Начиная с этого количества точки рисуются внахлёст с обводкой цвета фона. */
const OVERLAP_FROM = 4;

/** Точка-маркер под числом. */
export const CalendarMarker: FC<ICalendarMarkerProps> = memo(
  ({ color, index, count }) => {
    const { colors } = useTheme();
    const { styles } = useCalendarConfig();
    const overlap = count >= OVERLAP_FROM;

    return (
      <View
        style={[
          SS.dot,
          { backgroundColor: color ?? colors.primary },
          overlap && SS.overlap,
          overlap && index > 0 && SS.overlapShift,
          overlap && { borderColor: colors.background },
          styles.marker,
        ]}
      />
    );
  },
);

const SS = StyleSheet.create({
  dot: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
  },
  overlap: {
    width: MARKER_SIZE + 3,
    height: MARKER_SIZE + 3,
    borderRadius: (MARKER_SIZE + 3) / 2,
    borderWidth: 1.5,
  },
  overlapShift: { marginLeft: -3 },
});
