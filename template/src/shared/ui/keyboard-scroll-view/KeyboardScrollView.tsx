import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import { useKeyboardScrollCompensation } from "@shared/lib/hooks/use-keyboard-scroll-compensation";
import React, { forwardRef, useCallback } from "react";
import { LayoutChangeEvent, ScrollViewProps } from "react-native";
import Animated, { SharedValue } from "react-native-reanimated";

/**
 * `Animated.ScrollView` с компенсацией перекрытия снизу — для экранов,
 * у которых внизу стоит панель ввода (демо InputBar и подобные).
 *
 * В чате этот же хук используется напрямую: там распорка идёт в
 * `ListFooterComponent` FlashList, а `scrollRef` — в `renderScrollComponent`.
 *
 * @param bottomOverlay — суммарная высота того, что перекрывает скролл снизу:
 *   `max(клавиатура, safeArea) + высота панели ввода`. Меняется на UI-потоке,
 *   компенсация (распорка + scrollTo) происходит там же.
 */

export interface IKeyboardScrollViewProps extends ScrollViewProps {
  /** Суммарная высота перекрытия снизу — shared value с UI-потока. */
  bottomOverlay: SharedValue<number>;
}

export const KeyboardScrollView = forwardRef<
  Animated.ScrollView,
  IKeyboardScrollViewProps
>(
  (
    {
      bottomOverlay,
      children,
      onLayout: onLayoutProp,
      onContentSizeChange,
      ...rest
    },
    ref,
  ) => {
    const compensation = useKeyboardScrollCompensation(bottomOverlay);

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
