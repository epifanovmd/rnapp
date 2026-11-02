import React, { memo, ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "../../text";
import type { ICalendarMonthProps } from "../calendar.types";
import { useCalendarConfig } from "../context";
import { CalendarWeek } from "./CalendarWeek";

export const MONTH_TITLE_HEIGHT = 44;

/** Месяц как он есть: заголовок (если передан) и строки недель. Данные приходят пропсами. */
const CalendarMonthImpl = <TExtra,>(props: ICalendarMonthProps<TExtra>) => {
  const { grid, weeks, title } = props;
  const { styles, renderWeek, renderMonthTitle, weekGap } =
    useCalendarConfig<TExtra>();

  return (
    <View style={[SS.month, styles.month]}>
      {title !== undefined &&
        (renderMonthTitle ? (
          renderMonthTitle(props)
        ) : (
          <View style={SS.titleBox}>
            <Text
              textStyle={"Title_M"}
              style={[SS.title, styles.monthTitle]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
        ))}
      <View style={{ gap: weekGap }}>
        {weeks.map((days, index) => {
          const weekProps = { monthKey: grid.key, index, days };

          return renderWeek ? (
            <React.Fragment key={index}>{renderWeek(weekProps)}</React.Fragment>
          ) : (
            <CalendarWeek key={index} {...weekProps} />
          );
        })}
      </View>
    </View>
  );
};

export const CalendarMonth = memo(CalendarMonthImpl) as <TExtra>(
  props: ICalendarMonthProps<TExtra>,
) => ReactElement;

const SS = StyleSheet.create({
  month: { width: "100%" },
  titleBox: { height: MONTH_TITLE_HEIGHT, justifyContent: "center" },
  title: { paddingHorizontal: 8, textTransform: "capitalize" },
});
