import { useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { getTextStyle } from "../../text";

export interface ITextFieldLabelProps {
  label: string;
  /** Поле в фокусе или заполнено — label уплывает вверх. */
  active: boolean;
  error: boolean;
  duration: number;
}

const CAPTION = getTextStyle("Caption_M3");
const BODY = getTextStyle("Body_M2");

/** Плавающий label: уменьшается и подкрашивается при активности/ошибке. */
export const TextFieldLabel: FC<ITextFieldLabelProps> = memo(
  ({ label, active, error, duration }) => {
    const { colors } = useTheme();

    const animatedStyle = useAnimatedStyle(() => {
      const color = error
        ? colors.danger
        : active
          ? colors.primary
          : colors.textSecondary;
      const textStyle = active ? CAPTION : BODY;

      return {
        ...textStyle,
        fontSize: withTiming(textStyle.fontSize, { duration }),
        top: withTiming(active ? 0 : 12, { duration }),
        color: withTiming(color, { duration }),
      };
    }, [active, error, colors, duration]);

    return (
      <Animated.Text style={[styles.label, animatedStyle]}>
        {label}
      </Animated.Text>
    );
  },
);

const styles = StyleSheet.create({
  label: {
    position: "absolute",
  },
});
