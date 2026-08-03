import { useCallback, useMemo } from "react";
import { LayoutChangeEvent } from "react-native";
import Animated, {
  AnimatedRef,
  AnimatedStyle,
  scrollTo,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
} from "react-native-reanimated";

import { useConstant } from "../hooks";

/**
 * Распорка в конце контента + подъём скролла от одного `bottomInset`.
 * Распорка входит в размер контента — `scrollToEnd`/автоскролл верны без поправок.
 */

export interface IScrollCompensation {
  /** Ref скролла — на него уходит `scrollTo` с UI-потока. */
  scrollRef: AnimatedRef<Animated.ScrollView>;
  /** Стиль распорки в конце контента. */
  spacerStyle: AnimatedStyle<{ height: number }>;
  onLayout: (event: LayoutChangeEvent) => void;
  onContentSizeChange: (width: number, height: number) => void;
  /**
   * Обязательны к подключению: пока палец на экране, позицией управляет жест,
   * и компенсация обязана в неё не вмешиваться.
   */
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
}

export const useKeyboardScrollCompensation = (
  bottomInset: SharedValue<number>,
  /**
   * Зона, под которую распорка резервирует место сразу (целевая высота +
   * панель): высота проходит через layout, `contentSize` отстаёт на кадр —
   * без резерва у самого низа `scrollTo` упирается в ещё не выросший диапазон.
   */
  reservedInset?: SharedValue<number>,
): IScrollCompensation => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  // Зона не ноль на первом кадре — иначе дельта прокрутит контент на пустом месте.
  const initialInset = useConstant(() => bottomInset.value);

  const appliedInset = useSharedValue(initialInset);
  const isUserDragging = useSharedValue(false);
  const pendingEndPin = useSharedValue(false);
  // Дельту считаем от реальной позиции, поэтому она читается отсюда, а не
  // подставляется снаружи.
  const scrollY = useScrollViewOffset(scrollRef);
  const contentHeight = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const spacerHeight = useSharedValue(initialInset);

  useAnimatedReaction(
    () => bottomInset.value,
    target => {
      const applied = appliedInset.value;
      const delta = target - applied;

      if (Math.abs(delta) < 0.5) return;

      const reserve = reservedInset?.value ?? 0;
      const previousSpacer = Math.max(applied, reserve);

      appliedInset.value = target;
      spacerHeight.value = Math.max(target, reserve);

      if (isUserDragging.value) return;
      if (contentHeight.value <= 0 || viewportHeight.value <= 0) return;

      const contentEnd =
        contentHeight.value - previousSpacer + spacerHeight.value;
      const maxOffset = contentEnd - viewportHeight.value;

      if (maxOffset <= 0) return;

      const next = Math.min(Math.max(scrollY.value + delta, 0), maxOffset);

      pendingEndPin.value = next >= maxOffset - 0.5;

      scrollY.value = next;
      scrollTo(scrollRef, 0, next, false);
    },
  );

  // Досыл до конца после коммита распорки.
  useAnimatedReaction(
    () => contentHeight.value,
    height => {
      if (!pendingEndPin.value || isUserDragging.value) return;

      pendingEndPin.value = false;

      const maxOffset = height - viewportHeight.value;

      if (maxOffset <= 0) return;
      if (scrollY.value >= maxOffset - 0.5) return;

      scrollY.value = maxOffset;
      scrollTo(scrollRef, 0, maxOffset, false);
    },
  );

  // Резерв применяется сам по себе — цель известна до первого кадра движения.
  useAnimatedReaction(
    () => Math.max(appliedInset.value, reservedInset?.value ?? 0),
    height => {
      if (Math.abs(height - spacerHeight.value) < 0.5) return;

      spacerHeight.value = height;
    },
  );

  const spacerStyle = useAnimatedStyle(() => ({
    height: spacerHeight.value,
  }));

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewportHeight.value = event.nativeEvent.layout.height;
    },
    [viewportHeight],
  );

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeight.value = height;
    },
    [contentHeight],
  );

  const onScrollBeginDrag = useCallback(() => {
    isUserDragging.value = true;
    pendingEndPin.value = false;
  }, [isUserDragging, pendingEndPin]);

  const onScrollEndDrag = useCallback(() => {
    isUserDragging.value = false;
  }, [isUserDragging]);

  return useMemo(
    () => ({
      scrollRef,
      spacerStyle,
      onLayout,
      onContentSizeChange,
      onScrollBeginDrag,
      onScrollEndDrag,
    }),
    [
      scrollRef,
      spacerStyle,
      onLayout,
      onContentSizeChange,
      onScrollBeginDrag,
      onScrollEndDrag,
    ],
  );
};
