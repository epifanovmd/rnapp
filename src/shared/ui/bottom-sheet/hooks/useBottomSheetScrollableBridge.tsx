import {
  SCROLLABLE_TYPE,
  useScrollableSetter,
  useScrollEventsHandlersDefault,
} from "@gorhom/bottom-sheet";
import React, { ReactElement, useCallback, useMemo } from "react";
import { NativeScrollEvent } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureType,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedRef,
  useSharedValue,
} from "react-native-reanimated";

/** Worklet-обработчики фаз скролла внешнего ScrollView. */
export interface IBottomSheetScrollHandlers {
  onScroll?: (event: NativeScrollEvent) => void;
  onBeginDrag?: (event: NativeScrollEvent) => void;
  onEndDrag?: (event: NativeScrollEvent) => void;
  onMomentumEnd?: (event: NativeScrollEvent) => void;
}

/** Контекст штатных обработчиков gorhom (фиксация позиции при жесте шторки). */
interface IScrollLockContext {
  initialContentOffsetY: number;
  shouldLockInitialPosition: boolean;
}

type TScrollPhaseHandler = (event: NativeScrollEvent, context: never) => void;

/**
 * Нативный жест скролла для внешнего списка в шторке. Создаётся владельцем
 * шторки: тот же объект уходит в `simultaneousHandlers` шторки и в
 * {@link useBottomSheetScrollableBridge} внутри неё.
 */
export const useBottomSheetScrollGesture = (): GestureType =>
  useMemo(() => Gesture.Native().shouldCancelWhenOutside(false), []);

/**
 * Мост между шторкой и ScrollView, который создаёт сторонний список (например,
 * AnchorList) — то же, что делает `BottomSheetScrollView`, но на публичном API
 * gorhom: скролл регистрируется активным скроллаблом шторки, штатные
 * обработчики фиксируют позицию, пока тянется шторка, а нативный жест скролла
 * работает одновременно с жестом контента (`simultaneousHandlers` шторки).
 *
 * Возвращает ref, worklet-обработчики и обёртку ScrollView — их принимает
 * список (`refScrollView`/`scrollHandlers`/`renderScrollView` у AnchorList).
 */
export const useBottomSheetScrollableBridge = (gesture: GestureType) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const contentOffsetY = useSharedValue(0);
  const lockContext = useSharedValue<IScrollLockContext>({
    initialContentOffsetY: 0,
    shouldLockInitialPosition: false,
  });

  const gorhomRef = scrollRef as unknown as Parameters<
    typeof useScrollableSetter
  >[0];
  const handlers = useScrollEventsHandlersDefault(gorhomRef, contentOffsetY);

  useScrollableSetter(
    gorhomRef,
    SCROLLABLE_TYPE.SCROLLVIEW,
    contentOffsetY,
    false,
  );

  const scrollHandlers = useMemo<IBottomSheetScrollHandlers>(() => {
    const withContext = (handler?: TScrollPhaseHandler) =>
      handler
        ? (event: NativeScrollEvent) => {
            "worklet";
            lockContext.modify(context => {
              "worklet";
              handler(event, context as never);

              return context;
            });
          }
        : undefined;

    return {
      onScroll: withContext(handlers.handleOnScroll),
      onBeginDrag: withContext(handlers.handleOnBeginDrag),
      onEndDrag: withContext(handlers.handleOnEndDrag),
      onMomentumEnd: withContext(handlers.handleOnMomentumEnd),
    };
  }, [handlers, lockContext]);

  const renderScrollView = useCallback(
    (scrollView: ReactElement) => (
      <GestureDetector gesture={gesture}>{scrollView}</GestureDetector>
    ),
    [gesture],
  );

  return { scrollRef, scrollHandlers, renderScrollView };
};
