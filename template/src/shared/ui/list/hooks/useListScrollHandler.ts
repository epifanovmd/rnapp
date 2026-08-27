import type { SharedValue } from "react-native-reanimated";
import {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

/** Шаг, с которым пересчёт диапазона уходит в JS, px. */
const JS_SCROLL_STEP = 4;

export interface IListScrollHandlerOptions {
  /** Смещение скролла на UI-потоке — из него считается прилипание. */
  scrollOffset: SharedValue<number>;
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
 */
export const useListScrollHandler = ({
  scrollOffset,
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
        runOnJS(onScroll)(event.contentOffset.y);
      },
      onBeginDrag: () => runOnJS(onBeginDrag)(),
      onEndDrag: () => runOnJS(onEndDrag)(),
      onMomentumEnd: () => runOnJS(onMomentumEnd)(),
    },
    [onScroll, onBeginDrag, onEndDrag, onMomentumEnd],
  );
};
