import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import { useKeyboardScrollCompensation } from "@shared/lib/hooks/use-keyboard-scroll-compensation";
import React, { forwardRef, useCallback } from "react";
import { LayoutChangeEvent, ScrollViewProps } from "react-native";
import Animated, { SharedValue } from "react-native-reanimated";

/**
 * Скролл с компенсацией нижней зоны — обёртка над
 * `useKeyboardScrollCompensation` для обычных экранов (в чате хук
 * используется напрямую: там распорка уходит в `ListFooterComponent`).
 *
 * Вьюпорт остаётся на месте и во всю высоту, а зону, которую снизу
 * перекрывают панель ввода и клавиатура, держит распорка в конце контента.
 * Подробности алгоритма и заморозки — в доке хука.
 */

export interface IKeyboardScrollViewProps extends ScrollViewProps {
  /**
   * Нижняя зона: панель ввода + клавиатура (или safe area, когда та скрыта).
   * Заморозка делается на стороне владельца — достаточно перестать обновлять
   * это значение.
   */
  zone: SharedValue<number>;
}

export const KeyboardScrollView = forwardRef<
  Animated.ScrollView,
  IKeyboardScrollViewProps
>(
  (
    { zone, children, onLayout: onLayoutProp, onContentSizeChange, ...rest },
    ref,
  ) => {
    const compensation = useKeyboardScrollCompensation(zone);

    const handleLayout = useCallback(
      (e: LayoutChangeEvent) => {
        compensation.onLayout(e);
        onLayoutProp?.(e);
      },
      [compensation, onLayoutProp],
    );

    const handleContentSizeChange = useCallback(
      (width: number, height: number) => {
        compensation.onContentSizeChange(width, height);
        onContentSizeChange?.(width, height);
      },
      [compensation, onContentSizeChange],
    );

    return (
      <Animated.ScrollView
        ref={mergeRefs([ref, compensation.scrollRef])}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        {...rest}
      >
        {children}
        <Animated.View style={compensation.spacerStyle} />
      </Animated.ScrollView>
    );
  },
);

KeyboardScrollView.displayName = "KeyboardScrollView";
