import React, { forwardRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

export interface IKeyboardInputBarProps {
  children: React.ReactNode;
  /** Перекрытие снизу: клавиатура, а без неё — safe area. */
  offset: SharedValue<number>;
}

/**
 * Плавающая панель ввода, прижатая к верхней границе клавиатуры.
 *
 * Своей подписки на клавиатуру нет: величину перекрытия ведёт
 * `useKeyboardInset`, панель лишь поднимается на неё. Вторая подписка сделала
 * бы панель и контент двумя источниками движения.
 */
export const KeyboardInputBar = forwardRef<View, IKeyboardInputBarProps>(
  ({ children, offset }, ref) => {
    const style = useAnimatedStyle(() => ({
      transform: [{ translateY: -offset.value }],
    }));

    return (
      <Animated.View ref={ref} style={[ss.container, style]}>
        {children}
      </Animated.View>
    );
  },
);

KeyboardInputBar.displayName = "KeyboardInputBar";

const ss = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
});
