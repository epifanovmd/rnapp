import React, { forwardRef } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, { AnimatedStyle } from "react-native-reanimated";

/**
 * Плавающая панель ввода, прижатая к верхней границе клавиатуры.
 *
 * Следование за клавиатурой без
 * собственной подписки на клавиатуру: движение задаёт `style`, который
 * отдаёт `useKeyboardInset().barStyle`. Своя подписка была бы вторым
 * источником сдвига — панель и контент поехали бы по разным значениям.
 *
 * ```tsx
 * const kb = useKeyboardInset();
 *
 * <KeyboardInputBar style={kb.barStyle}>
 *   <InputBar onHeightChange={kb.setBarHeight} />
 * </KeyboardInputBar>
 * ```
 */

export interface IKeyboardInputBarProps {
  children: React.ReactNode;
  /** Анимированный стиль движения — `useKeyboardInset().barStyle`. */
  style?: AnimatedStyle<ViewStyle>;
}

export const KeyboardInputBar = forwardRef<View, IKeyboardInputBarProps>(
  ({ children, style }, ref) => (
    <Animated.View ref={ref} style={[ss.container, style]}>
      {children}
    </Animated.View>
  ),
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
