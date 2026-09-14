import { CalendarDay, ICalendarDayProps } from "@shared/ui";
import React from "react";
import { StyleSheet, View } from "react-native";

/** Пример кастомного дня: стандартная ячейка + подсветка каждого 13-го числа. */
export const renderUnluckyDay = (props: ICalendarDayProps) =>
  props.day === 13 && !props.isOutside ? (
    <View style={SS.unlucky}>
      <CalendarDay {...props} />
    </View>
  ) : (
    <CalendarDay {...props} />
  );

const SS = StyleSheet.create({
  unlucky: { flex: 1, backgroundColor: "#FDF1F4", borderRadius: 12 },
});
