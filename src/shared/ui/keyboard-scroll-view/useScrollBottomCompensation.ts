import { useConstant } from "@shared/lib/hooks";
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

/**
 * Компенсация нижнего перекрытия для обычного `ScrollView`.
 *
 * Одно значение `insetEnd` даёт и распорку в конце контента, и подъём
 * смещения: распорка входит в размер контента, поэтому `scrollToEnd` и
 * автоскролл верны без поправок. О клавиатуре хук не знает — ему приходит уже
 * посчитанное перекрытие.
 *
 * `AnchorList` то же самое делает сам по пропу `insetEnd`; этот хук нужен
 * только там, где список нативный.
 */

export interface IScrollCompensation {
  /** Ref скролла — на него уходит `scrollTo` с UI-потока. */
  scrollRef: AnimatedRef<Animated.ScrollView>;
  /** Стиль распорки в конце контента. */
  spacerStyle: AnimatedStyle<{ height: number }>;
  /**
   * Высота той же распорки числом — нижний отступ контента.
   *
   * Нужна тем, кто обязан кончаться на одной линии с контентом, но живёт вне
   * его координат: индикатор скролла отсчитывается от кромки `ScrollView` и о
   * распорке в подвале не знает.
   */
  contentInset: SharedValue<number>;
  onLayout: (event: LayoutChangeEvent) => void;
  onContentSizeChange: (width: number, height: number) => void;
  /**
   * Обязательны к подключению: пока палец на экране, позицией управляет жест,
   * и компенсация обязана в неё не вмешиваться.
   */
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
}

export const useScrollBottomCompensation = (
  insetEnd: SharedValue<number>,
  /**
   * Перекрытие, к которому едем: распорка резервирует место сразу. Высота
   * проходит через layout, `contentSize` отстаёт на кадр — без резерва у
   * самого низа `scrollTo` упирается в ещё не выросший диапазон.
   */
  reservedInset?: SharedValue<number>,
): IScrollCompensation => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  // Начальное значение инсета — иначе нулевая дельта сдвинет контент при старте.
  const initialInset = useConstant(() => insetEnd.value);

  const appliedInset = useSharedValue(initialInset);
  const isUserDragging = useSharedValue(false);
  const pendingEndPin = useSharedValue(false);
  // Дельта вычисляется от реальной позиции скролла, а не передаётся извне.
  const scrollY = useScrollViewOffset(scrollRef);
  const contentHeight = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const spacerHeight = useSharedValue(initialInset);

  useAnimatedReaction(
    () => insetEnd.value,
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
      contentInset: spacerHeight,
      onLayout,
      onContentSizeChange,
      onScrollBeginDrag,
      onScrollEndDrag,
    }),
    [
      scrollRef,
      spacerStyle,
      spacerHeight,
      onLayout,
      onContentSizeChange,
      onScrollBeginDrag,
      onScrollEndDrag,
    ],
  );
};
