import React, { memo, ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import type { ICalendarDayState, ICalendarWeekProps } from "../calendar.types";
import { useCalendarActions, useCalendarConfig } from "../context";
import { CalendarDay } from "./CalendarDay";

const hasDayContent = (day: ICalendarDayState) =>
  !!day.data?.label || !!day.data?.markers?.length;

/** Строка недели: 7 ячеек одинаковой ширины вплотную, чтобы полоса периода шла без разрывов. */
const CalendarWeekImpl = <TExtra,>({
  days,
  monthKey,
  index,
}: ICalendarWeekProps<TExtra>) => {
  const { styles, renderDay } = useCalendarConfig<TExtra>();
  const { pressDay, longPressDay } = useCalendarActions();
  const hasRowContent = days.some(hasDayContent);

  return (
    <View
      style={[SS.week, styles.week]}
      testID={`calendar-week-${monthKey}-${index}`}
    >
      {days.map(day => {
        const props = {
          ...day,
          onPress: pressDay,
          onLongPress: longPressDay,
          hasRowContent,
        };

        return renderDay ? (
          <React.Fragment key={day.dateKey}>{renderDay(props)}</React.Fragment>
        ) : (
          <CalendarDay key={day.dateKey} {...props} />
        );
      })}
    </View>
  );
};

export const CalendarWeek = memo(CalendarWeekImpl) as <TExtra>(
  props: ICalendarWeekProps<TExtra>,
) => ReactElement;

const SS = StyleSheet.create({
  week: { flexDirection: "row" },
});
