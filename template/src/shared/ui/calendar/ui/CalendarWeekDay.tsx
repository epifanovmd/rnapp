import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "../../text";
import type { ICalendarWeekDayProps } from "../calendar.types";
import { useCalendarConfig } from "../context";

export const CalendarWeekDay: FC<ICalendarWeekDayProps> = memo(({ label }) => {
  const { styles } = useCalendarConfig();

  return (
    <View style={[SS.cell, styles.weekDay]}>
      <Text
        textStyle={"Caption_M3"}
        color={"textSecondary"}
        style={[SS.text, styles.weekDayText]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
});

const SS = StyleSheet.create({
  cell: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { textAlign: "center" },
});
