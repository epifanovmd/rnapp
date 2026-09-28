import React, { FC } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { useCalendarConfig, useCalendarMonthState } from "../context";
import { CalendarHeaderConnected } from "./CalendarHeaderConnected";
import { CalendarMonthConnected } from "./CalendarMonthConnected";
import { CalendarMonthSlider } from "./CalendarMonthSlider";
import { CalendarWeekDaysConnected } from "./CalendarWeekDaysConnected";

export interface ICalendarViewProps {
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
  animationDuration?: number;
  gestureEnabled?: boolean;
}

const DEFAULT_ANIMATION_DURATION = 250;

/** Тело одиночного календаря: шапка, дни недели и текущий месяц (со слайдером или без). */
export const CalendarView: FC<ICalendarViewProps> = ({
  style,
  animated = true,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  gestureEnabled = true,
}) => {
  const { showHeader, showWeekDays, styles } = useCalendarConfig();
  const { monthKey } = useCalendarMonthState();

  return (
    <View style={[styles.container, style]}>
      {showHeader && <CalendarHeaderConnected />}
      {showWeekDays && <CalendarWeekDaysConnected />}
      {animated ? (
        <CalendarMonthSlider
          monthKey={monthKey}
          duration={animationDuration}
          gestureEnabled={gestureEnabled}
        />
      ) : (
        <CalendarMonthConnected monthKey={monthKey} />
      )}
    </View>
  );
};
