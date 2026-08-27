import type { SharedValue } from "react-native-reanimated";
import {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

/** Шаг, с которым пересчёт диапазона уходит в JS, px. */
const JS_SCROLL_STEP = 24;

/** Что обработчик скролла пишет на UI-потоке и что уводит в JS. */
export interface IListScrollHandlerOptions {
  /** Смещение скролла на UI-потоке — из него считается прилипание. */
  scrollOffset: SharedValue<number>;
  /** Палец на экране; пишется на UI-потоке, без захода в JS. */
  isDragging?: SharedValue<boolean>;
  /** Идёт инерция после броска; пишется там же. */
  isMomentum?: SharedValue<boolean>;
  /** Пересчёт диапазона отрисовки; вызывается шагами, а не на каждый пиксель. */
  onScroll: (offset: number) => void;
  onBeginDrag: () => void;
  onEndDrag: () => void;
  onMomentumEnd: () => void;
}

/**
 * Обработка скролла одним worklet-обработчиком.
 *
 * Зачем нужен: смещение обязано попадать в shared value синхронно с нативным
 * скроллом — от него зависит прилипание, и отставание хотя бы на кадр видно как
 * дрожание заголовка.
 *
 * Какую проблему решает: переход в JS на каждом кадре скролла. Туда уходит
 * только пересчёт диапазона отрисовки, и то шагами по {@link JS_SCROLL_STEP}:
 * он определяет, какие ячейки смонтированы, и точность в один пиксель ему не
 * нужна — буфер отрисовки на порядок больше этого шага.
 *
 * Фаза жеста пишется прямо здесь, без захода в JS: она нужна тем, кто реагирует
 * на прикосновение в тот же кадр — спрятать кнопку под пальцем, закрыть
 * клавиатуру, притормозить тяжёлый эффект на время инерции.
 */
export const useListScrollHandler = ({
  scrollOffset,
  isDragging,
  isMomentum,
  onScroll,
  onBeginDrag,
  onEndDrag,
  onMomentumEnd,
}: IListScrollHandlerOptions) => {
  /** Смещение, при котором в JS уходил последний пересчёт диапазона. */
  const lastReportedScroll = useSharedValue(0);

  return useAnimatedScrollHandler(
    {
      onScroll: event => {
        scrollOffset.value = event.contentOffset.y;

        if (
          Math.abs(event.contentOffset.y - lastReportedScroll.value) <
          JS_SCROLL_STEP
        )
          return;

        lastReportedScroll.value = event.contentOffset.y;
        scheduleOnRN(onScroll, event.contentOffset.y);
      },
      onBeginDrag: () => {
        if (isDragging) isDragging.value = true;

        scheduleOnRN(onBeginDrag);
      },
      onEndDrag: event => {
        if (isDragging) isDragging.value = false;

        const offset = event.contentOffset.y;

        if (offset !== lastReportedScroll.value) {
          lastReportedScroll.value = offset;
          scheduleOnRN(onScroll, offset);
        }

        scheduleOnRN(onEndDrag);
      },
      // Инерция начинается только после отпускания пальца, и только если бросок
      // был: короткое перетаскивание завершается на `onEndDrag` без неё.
      onMomentumBegin: () => {
        if (isMomentum) isMomentum.value = true;
      },
      onMomentumEnd: event => {
        if (isMomentum) isMomentum.value = false;

        const offset = event.contentOffset.y;

        if (offset !== lastReportedScroll.value) {
          lastReportedScroll.value = offset;
          scheduleOnRN(onScroll, offset);
        }

        scheduleOnRN(onMomentumEnd);
      },
    },
    [isDragging, isMomentum, onScroll, onBeginDrag, onEndDrag, onMomentumEnd],
  );
};
