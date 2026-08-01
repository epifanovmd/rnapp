import React, { forwardRef } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useKeyboardOverlay } from "./use-keyboard-overlay";

/**
 * Панель, приклеенная к верхней границе клавиатуры — порт
 * `keyboardLayoutGuide` + `followsUndockedKeyboard` из пода.
 *
 * Высота берётся покадрово на UI-потоке, поэтому панель едет вместе с
 * клавиатурой (в том числе при интерактивном закрытии свайпом), а не
 * прыгает после анимации.
 *
 * Компонент самодостаточен: без `overlay` он сам подписывается на
 * клавиатуру. `overlay` передают, когда зоной управляют снаружи — чтобы
 * панель, список и FAB считались от одного значения и замирали разом при
 * заморозке под контекстным меню.
 */

export interface IKeyboardFloatingViewProps {
  children: React.ReactNode;
  /**
   * Внешняя нижняя зона. Если не передана — компонент отслеживает
   * клавиатуру самостоятельно.
   */
  overlay?: SharedValue<number>;
  style?: ViewStyle;
}

export const KeyboardFloatingView = forwardRef<
  View,
  IKeyboardFloatingViewProps
>(({ children, overlay: externalOverlay, style }, ref) => {
  const { overlay: internalOverlay } = useKeyboardOverlay();
  const effectiveOverlay = externalOverlay ?? internalOverlay;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -effectiveOverlay.value }],
  }));

  return (
    <Animated.View ref={ref} style={[ss.container, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
});

KeyboardFloatingView.displayName = "KeyboardFloatingView";

const ss = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
});
