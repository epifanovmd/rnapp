import { useTheme } from "@shared/lib/theme";
import React, { memo, ReactElement, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "../../text";
import type { ICalendarDayProps } from "../calendar.types";
import { useCalendarConfig } from "../context";
import { formatDate, resolveRangeFill } from "../model";
import { CalendarDayContent } from "./CalendarDayContent";

const INNER_RADIUS = 12;
const INNER_PADDING_TOP = 4;

/**
 * Ячейка дня. Снизу вверх: полоса периода (за ячейкой), скруглённая плашка
 * с фоном выбора, число и контент под ним. Обработчики получают ключ дня,
 * поэтому одна и та же функция подходит всем ячейкам.
 */
const CalendarDayImpl = <TExtra,>(props: ICalendarDayProps<TExtra>) => {
  const {
    dateKey,
    date,
    isOutside,
    isToday,
    isDisabled,
    isSelected,
    isRangeStart,
    isRangeEnd,
    onPress,
    onLongPress,
    hasRowContent,
  } = props;
  const { colors, isDark } = useTheme();
  const { styles, formats, dayHeight, showOutsideDays, renderDayContent } =
    useCalendarConfig<TExtra>();
  // Синие тона палитры одинаковы в обеих темах, поэтому для тёмной берём тёмные вручную.
  const rangeColor = isDark ? colors.blue900 : colors.blue50;
  const selectedColor = isDark ? colors.blue800 : colors.blue100;

  const handlePress = useCallback(() => onPress?.(dateKey), [dateKey, onPress]);
  const handleLongPress = useCallback(
    () => onLongPress?.(dateKey),
    [dateKey, onLongPress],
  );

  if (isOutside && !showOutsideDays) {
    return <View style={[SS.cell, { height: dayHeight }, styles.day]} />;
  }

  const isEdge = isRangeStart || isRangeEnd;
  const fill = resolveRangeFill(props);

  const rangeStyle = [
    SS.fill,
    { backgroundColor: rangeColor },
    styles.dayRange,
  ];
  const textColor = isDisabled
    ? "textDisabled"
    : isOutside
      ? "textTertiary"
      : isToday && !isSelected
        ? "primary"
        : "textPrimary";

  return (
    <Pressable
      accessibilityRole={"button"}
      accessibilityState={{ disabled: isDisabled, selected: isSelected }}
      disabled={isDisabled}
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      style={[SS.cell, { height: dayHeight }, styles.day]}
    >
      {fill !== "none" && <View style={[rangeStyle, SS[fill]]} />}
      <View
        style={[
          SS.inner,
          hasRowContent && SS.innerWithContent,
          styles.dayInner,
          isToday && styles.dayToday,
          isOutside && styles.dayOutside,
          isDisabled && styles.dayDisabled,
        ]}
      >
        {isSelected && (
          <View
            style={[
              SS.highlight,
              { backgroundColor: selectedColor },
              styles.daySelected,
              isEdge && styles.dayRangeEdge,
            ]}
          />
        )}
        <Text
          textStyle={"Body_L1"}
          color={textColor}
          style={[
            SS.text,
            styles.dayText,
            isToday && styles.dayTodayText,
            isOutside && styles.dayOutsideText,
            isDisabled && styles.dayDisabledText,
            isSelected && styles.daySelectedText,
          ]}
        >
          {formatDate(date, formats.day)}
        </Text>
        {renderDayContent ? (
          renderDayContent(props)
        ) : (
          <CalendarDayContent {...props} />
        )}
      </View>
    </Pressable>
  );
};

export const CalendarDay = memo(CalendarDayImpl) as <TExtra>(
  props: ICalendarDayProps<TExtra>,
) => ReactElement;

const SS = StyleSheet.create({
  cell: { flex: 1, justifyContent: "center", alignItems: "center" },
  fill: { position: "absolute", top: 0, bottom: 0 },
  left: { left: 0, width: "50%" },
  right: { right: 0, width: "50%" },
  full: { left: 0, right: 0 },
  inner: {
    alignSelf: "stretch",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: INNER_RADIUS,
  },
  // Когда под числом есть контент, число уезжает вверх — небольшой отступ возвращает его к центру.
  innerWithContent: { paddingTop: INNER_PADDING_TOP },
  text: { textAlign: "center" },
});
