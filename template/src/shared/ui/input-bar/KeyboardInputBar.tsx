import React, { forwardRef, useMemo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useKeyboardInset } from "../../lib/hooks/use-keyboard-inset";

/**
 * Самодостаточная обёртка InputBar с привязкой к клавиатуре.
 *
 * - Без внешнего управления: сама отслеживает клавиатуру через
 *   `useKeyboardInset` и прижимает панель к верхней границе клавиатуры
 *   (или к safe area, когда клавиатура скрыта).
 * - С внешним управлением: если передан `bottomInset` (SharedValue),
 *   использует его — клавиатура отслеживается извне. Это позволяет чату
 *   подменять зону при открытии контекстного меню (freeze/thaw).
 *
 * Порт keyboardLayoutGuide + followsUndockedKeyboard из пода.
 */

export interface IKeyboardInputBarProps {
  /** Контент — InputBar, JsInputBar или InputBarView. */
  children: React.ReactNode;
  /**
   * Внешнее управление нижней зоной. Если передано — используется это
   * значение, а встроенное отслеживание клавиатуры отключается.
   * Если не передано — компонент сам отслеживает клавиатуру.
   */
  bottomInset?: SharedValue<number>;
  /** Стиль контейнера. */
  style?: ViewStyle;
}

export const KeyboardInputBar = forwardRef<View, IKeyboardInputBarProps>(
  ({ children, bottomInset: externalInset, style }, ref) => {
    const { bottomInset: internalInset } = useKeyboardInset();
    const effectiveInset = externalInset ?? internalInset;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: -effectiveInset.value }],
    }));

    const containerStyle = useMemo<ViewStyle>(
      () => ({
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
      }),
      [],
    );

    return (
      <Animated.View
        ref={ref}
        style={[ss.container, containerStyle, style, animatedStyle]}
      >
        {children}
      </Animated.View>
    );
  },
);

KeyboardInputBar.displayName = "KeyboardInputBar";

const ss = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },
});
