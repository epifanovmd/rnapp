import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import { IScrollCompensation } from "@shared/lib/keyboard";
import React, { forwardRef } from "react";
import { Platform, ScrollViewProps } from "react-native";
import Animated from "react-native-reanimated";

/**
 * Скролл с компенсацией перекрытия снизу — обвязка над готовой
 * компенсацией из `useKeyboardScrollCompensation`.
 *
 * Компонент намеренно не создаёт компенсацию сам: тогда на экране
 * появилась бы вторая подписка на клавиатуру, и панель с контентом
 * поехали бы по разным значениям. Хуки живут на экране, сюда приходит
 * только результат.
 *
 * ```tsx
 * const kb = useKeyboardInset({ extraPadding: 8 });
 * const compensation = useKeyboardScrollCompensation(
 *   kb.contentInset,
 *   kb.reservedInset,
 * );
 *
 * <KeyboardScrollView scroll={compensation}>{content}</KeyboardScrollView>
 *
 * <KeyboardInputBar style={kb.barStyle}>
 *   <InputBar onHeightChange={kb.setBarHeight} />
 * </KeyboardInputBar>
 * ```
 */

export interface IKeyboardScrollViewProps extends ScrollViewProps {
  /** Компенсация из `useKeyboardScrollCompensation`. */
  scroll: IScrollCompensation;
}

export const KeyboardScrollView = forwardRef<
  Animated.ScrollView,
  IKeyboardScrollViewProps
>(
  (
    {
      scroll,
      children,
      onLayout,
      onContentSizeChange,
      onScrollBeginDrag,
      onScrollEndDrag,
      ...rest
    },
    ref,
  ) => (
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
  ),
);

KeyboardScrollView.displayName = "KeyboardScrollView";
