import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { Text } from "../../text";

export interface ITextFieldFooterProps {
  error?: string | boolean;
  showCounter: boolean;
  length: number;
  maxLength?: number;
  duration: number;
}

/** Нижняя строка поля: текст ошибки слева, счётчик символов справа. */
export const TextFieldFooter: FC<ITextFieldFooterProps> = memo(
  ({ error, showCounter, length, maxLength, duration }) => {
    const visible = !!error || showCounter;
    const overLimit = !!maxLength && length > maxLength;

    const animatedStyle = useAnimatedStyle(
      () => ({
        marginTop: visible ? 4 : 0,
        height: withTiming(visible ? 16 : 0, { duration }),
      }),
      [visible, duration],
    );

    return (
      <Animated.View style={[styles.container, animatedStyle]}>
        {!!error && typeof error === "string" && (
          <Text textStyle={"Caption_M3"} color={"danger"}>
            {error}
          </Text>
        )}
        {showCounter && (
          <Text
            style={styles.counter}
            textStyle={"Caption_M3"}
            color={overLimit ? "danger" : "textTertiary"}
          >
            {`${length} / ${maxLength}`}
          </Text>
        )}
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    height: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  counter: {
    marginLeft: "auto",
  },
});
