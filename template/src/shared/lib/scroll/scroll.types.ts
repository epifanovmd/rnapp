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
 * Состояние скролла для чтения: любое scroll-зависимое поведение (панели,
 * pull-to-refresh, коллапс-хедеры, параллакс) читает эти shared values или
 * реагирует на них через useAnimatedReaction.
 */
export interface IScrollValues {
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
  /** Максимально возможный offsetY (высота контента минус высота окна) */
  maxOffsetY: SharedValue<number>;
}

/**
 * Телеметрия скролла — единственный владелец scroll-событий компонента:
 * значения плюс обработчики, которые их ведут. Владеет ею тот, кто вешает
 * scrollHandler на скроллящийся компонент.
 */
export interface IScrollTelemetry extends IScrollValues {
  /** Готовый обработчик для onScroll скроллящегося компонента */
  scrollHandler: ScrollHandlerProcessed;
  /** Те же worklet-обработчики — для ручной композиции */
  handlers: IScrollWorkletHandlers;
}
