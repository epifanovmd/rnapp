import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import React, { forwardRef } from "react";
import { Platform, ScrollViewProps } from "react-native";
import Animated, { SharedValue } from "react-native-reanimated";

import { useScrollBottomCompensation } from "./useScrollBottomCompensation";

/**
 * Скролл, кончающийся над панелью ввода и едущий вместе с клавиатурой.
 *
 * Перекрытие снизу считает вызывающий — обычно `useInputBarInset`, у которого
 * подписка на клавиатуру одна на экран, — и отдаёт сюда одним значением.
 * Распорку в конце контента и подъём смещения компонент делает сам.
 *
 * ```tsx
 * const inset = useInputBarInset();
 *
 * <KeyboardScrollView
 *   insetEnd={inset.contentInset}
 *   reservedInset={inset.reservedInset}
 * >
 *   {content}
 * </KeyboardScrollView>
 *
 * <KeyboardInputBar offset={inset.barOffset}>
 *   <InputBar onHeightChange={inset.setBarHeight} />
 * </KeyboardInputBar>
 * ```
 */

export interface IKeyboardScrollViewProps extends ScrollViewProps {
  /** Перекрытие снизу: панель ввода плюс клавиатура или safe area. */
  insetEnd: SharedValue<number>;
  /** Перекрытие, к которому едем: распорка резервирует место сразу. */
  reservedInset?: SharedValue<number>;
}

export const KeyboardScrollView = forwardRef<
  Animated.ScrollView,
  IKeyboardScrollViewProps
>(
  (
    {
      insetEnd,
      reservedInset,
      children,
      onLayout,
      onContentSizeChange,
      onScrollBeginDrag,
      onScrollEndDrag,
      ...rest
    },
    ref,
  ) => {
    const scroll = useScrollBottomCompensation(insetEnd, reservedInset);

    return (
      <Animated.ScrollView
        ref={mergeRefs([ref, scroll.scrollRef])}
        // Порт keyboardDismissMode = .interactive: контент и панель едут за
        // пальцем покадрово. Перекрывается пропом.
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        scrollEventThrottle={16}
        onLayout={event => {
          scroll.onLayout(event);
          onLayout?.(event);
        }}
        onContentSizeChange={(width, height) => {
          scroll.onContentSizeChange(width, height);
          onContentSizeChange?.(width, height);
        }}
        onScrollBeginDrag={event => {
          scroll.onScrollBeginDrag();
          onScrollBeginDrag?.(event);
        }}
        onScrollEndDrag={event => {
          scroll.onScrollEndDrag();
          onScrollEndDrag?.(event);
        }}
        {...rest}
      >
        {children}
        <Animated.View style={scroll.spacerStyle} />
      </Animated.ScrollView>
    );
  },
);

KeyboardScrollView.displayName = "KeyboardScrollView";
