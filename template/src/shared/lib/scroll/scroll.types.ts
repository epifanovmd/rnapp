import { NativeScrollEvent } from "react-native";
import { ScrollHandlerProcessed, SharedValue } from "react-native-reanimated";

export type TScrollDirection = "up" | "down" | "left" | "right" | null;

/** Worklet-обработчики фаз скролла — для композиции сторонней логики */
export interface IScrollWorkletHandlers {
  onScroll?: (event: NativeScrollEvent) => void;
  onBeginDrag?: (event: NativeScrollEvent) => void;
  onEndDrag?: (event: NativeScrollEvent) => void;
  onMomentumBegin?: (event: NativeScrollEvent) => void;
  onMomentumEnd?: (event: NativeScrollEvent) => void;
}

/**
 * Телеметрия скролла — единственный владелец scroll-событий компонента.
 * Любое scroll-зависимое поведение (бары, pull-to-refresh, коллапс-хедеры,
 * параллакс) читает shared values или реагирует через useAnimatedReaction —
 * без конкуренции за onScroll.
 */
export interface IScrollTelemetry {
  offsetX: SharedValue<number>;
  offsetY: SharedValue<number>;
  /** Палец на экране (между onBeginDrag и onEndDrag) */
  isDragging: SharedValue<boolean>;
  /** Инерционный скролл */
  isMomentum: SharedValue<boolean>;
  direction: SharedValue<TScrollDirection>;
  /** Overscroll за верхней границей, ≥ 0 (iOS bounce) */
  overscrollTop: SharedValue<number>;
  /** Overscroll за нижней границей, ≥ 0 */
  overscrollBottom: SharedValue<number>;
  /** Готовый обработчик для onScroll скроллящегося компонента */
  scrollHandler: ScrollHandlerProcessed;
  /** Те же worklet-обработчики — для ручной композиции */
  handlers: IScrollWorkletHandlers;
}
