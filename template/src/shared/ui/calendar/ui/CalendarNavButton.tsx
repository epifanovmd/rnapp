import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";

import { Icon } from "../../icon";
import { Touchable } from "../../touchable";
import type { ICalendarNavButtonProps } from "../calendar.types";
import { useCalendarConfig } from "../context";

const SIZE = 36;

/** Кнопка перехода к предыдущему или следующему месяцу. */
export const CalendarNavButton: FC<ICalendarNavButtonProps> = memo(
  ({ direction, disabled, onPress }) => {
    const { styles } = useCalendarConfig();

    return (
      <Touchable
        accessibilityRole={"button"}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        bg={"onSurface"}
        radius={12}
        centerContent
        opacity={disabled ? 0.4 : 1}
        style={[SS.button, styles.navButton]}
      >
        <Icon
          name={direction === "prev" ? "chevronLeft" : "chevronRight"}
          size={20}
        />
      </Touchable>
    );
  },
);

const SS = StyleSheet.create({
  button: { width: SIZE, height: SIZE },
});
