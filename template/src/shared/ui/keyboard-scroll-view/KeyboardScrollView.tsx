import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import {
  useBottomInset,
  useKeyboardOverlay,
  useScrollCompensation,
} from "@shared/lib/keyboard";
import React, { forwardRef } from "react";
import { Platform, ScrollViewProps } from "react-native";
import Animated, { SharedValue } from "react-native-reanimated";

/**
 * Скролл с компенсацией перекрытия снизу — для экранов, у которых внизу
 * стоит плавающая панель ввода.
 *
 * Использует ту же связку, что и чат (`ChatList`): единственный источник
 * сдвига — `bottomInset`, от которого одновременно живут распорка в конце
 * контента, позиция скролла и `translateY` панели. Логика — в
 * `shared/lib/keyboard`, здесь только подключение, поэтому чат и обычные
 * экраны не расходятся в поведении.
 *
 * ```tsx
 * const { overlay } = useKeyboardOverlay();
 * const barHeight = useBarHeight();
 *
 * <KeyboardScrollView barHeight={barHeight}>{content}</KeyboardScrollView>
 * <KeyboardFloatingView overlay={overlay}>
 *   <InputBar onHeightChange={h => (barHeight.value = h)} />
 * </KeyboardFloatingView>
 * ```
 */

export interface IKeyboardScrollViewProps extends ScrollViewProps {
  /** Живая высота плавающей панели над скроллом. */
  barHeight: SharedValue<number>;
  /** Собственные отступы контента снизу. */
  extraPadding?: number;
  /**
   * Внешняя нижняя зона. Передают, когда ей управляют снаружи (например,
   * чтобы заморозить всё разом под оверлеем); иначе хук считает её сам.
   */
  overlay?: SharedValue<number>;
  /**
   * Целевая зона к внешнему `overlay` (`useKeyboardOverlay().overlayTarget`).
   * Передают вместе с ним: без неё у самого низа контент отстаёт на кадр.
   */
  overlayTarget?: SharedValue<number>;
}

export const KeyboardScrollView = forwardRef<
  Animated.ScrollView,
  IKeyboardScrollViewProps
>(
  (
    {
      barHeight,
      extraPadding = 0,
      overlay: externalOverlay,
      overlayTarget: externalOverlayTarget,
      children,
      onLayout,
      onContentSizeChange,
      onScrollBeginDrag,
      onScrollEndDrag,
      ...rest
    },
    ref,
  ) => {
    // Внутренняя подписка нужна только для самостоятельного режима. Когда
    // `overlay` передан снаружи, она ничего не ведёт: значение, которое она
    // пишет, никто не читает — источником сдвига остаётся внешнее.
    const { overlay: internalOverlay, overlayTarget: internalTarget } =
      useKeyboardOverlay();
    const bottomInset = useBottomInset(
      externalOverlay ?? internalOverlay,
      barHeight,
      extraPadding,
    );
    // Резерв под целевую зону — см. «Готовность диапазона» в хуке.
    const reservedInset = useBottomInset(
      externalOverlayTarget ?? internalTarget,
      barHeight,
      extraPadding,
    );
    const compensation = useScrollCompensation(bottomInset, reservedInset);

    return (
      <Animated.ScrollView
        ref={mergeRefs([ref, compensation.scrollRef])}
        // Как в чате (порт keyboardDismissMode = .interactive): контент и
        // панель едут за пальцем покадрово. Перекрывается пропом.
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        onLayout={event => {
          compensation.onLayout(event);
          onLayout?.(event);
        }}
        onContentSizeChange={(width, height) => {
          compensation.onContentSizeChange(width, height);
          onContentSizeChange?.(width, height);
        }}
        onScrollBeginDrag={event => {
          compensation.onScrollBeginDrag();
          onScrollBeginDrag?.(event);
        }}
        onScrollEndDrag={event => {
          compensation.onScrollEndDrag();
          onScrollEndDrag?.(event);
        }}
        scrollEventThrottle={16}
        {...rest}
      >
        {children}
        <Animated.View style={compensation.spacerStyle} />
      </Animated.ScrollView>
    );
  },
);

KeyboardScrollView.displayName = "KeyboardScrollView";
