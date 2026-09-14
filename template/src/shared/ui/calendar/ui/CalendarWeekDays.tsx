import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";

import type { ICalendarWeekDaysProps } from "../calendar.types";
import { useCalendarConfig } from "../context";
import { CalendarWeekDay } from "./CalendarWeekDay";

export const WEEK_DAYS_HEIGHT = 32;

/** Строка с названиями дней недели. */
export const CalendarWeekDays: FC<ICalendarWeekDaysProps> = memo(
  ({ items }) => {
    const { styles, renderWeekDay } = useCalendarConfig();

    return (
      <View style={[SS.row, styles.weekDays]}>
        {items.map(item =>
          renderWeekDay ? (
            <React.Fragment key={item.weekday}>
              {renderWeekDay(item)}
            </React.Fragment>
          ) : (
            <CalendarWeekDay key={item.weekday} {...item} />
          ),
        )}
      </View>
    );
  },
);

const SS = StyleSheet.create({
  row: { flexDirection: "row", height: WEEK_DAYS_HEIGHT },
});
