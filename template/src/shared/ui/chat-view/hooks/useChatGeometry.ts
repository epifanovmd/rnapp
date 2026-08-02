import type { LegendListRef } from "@legendapp/list/react-native";
import { RefObject, useCallback, useMemo, useRef } from "react";

import { IChatGeometry } from "../scroll";

/**
 * Адаптер геометрии `LegendList` к `IChatGeometry`.
 *
 * Вся логика чата зависит от узкого `IChatGeometry`, а знание о конкретной
 * библиотеке списка заперто здесь: её замена = замена одного этого файла.
 * Значения читаются лениво — `getState()` живой, кешировать его нельзя.
 */

export interface IChatGeometryController {
  /** Снимок геометрии на текущий момент. */
  read: () => IChatGeometry;
  /** Запомнить размеры вьюпорта из `onLayout` — до первого скролла их нет. */
  setViewport: (width: number, height: number) => void;
  /** Ширина списка — нужна ячейкам для расчёта максимальной ширины пузыря. */
  getWidth: () => number;
}

const EMPTY_RANGE = { start: 0, end: -1 };

export const useChatGeometry = (
  listRef: RefObject<LegendListRef | null>,
): IChatGeometryController => {
  const viewportRef = useRef({ width: 0, height: 0 });

  const setViewport = useCallback((width: number, height: number) => {
    viewportRef.current = { width, height };
  }, []);

  const getWidth = useCallback(() => viewportRef.current.width, []);

  const read = useCallback((): IChatGeometry => {
    const state = listRef.current?.getState();
    const fallbackHeight = viewportRef.current.height;

    if (!state) {
      return {
        scrollY: 0,
        viewportHeight: fallbackHeight,
        contentHeight: 0,
        rowTop: () => undefined,
        rowHeight: () => undefined,
        visibleRange: EMPTY_RANGE,
      };
    }

    return {
      scrollY: state.scroll,
      // scrollLength — длина вьюпорта по оси скролла; до первого layout
      // она нулевая, поэтому подстраховываемся замером из onLayout.
      viewportHeight: state.scrollLength || fallbackHeight,
      contentHeight: state.contentLength,
      rowTop: index => {
        const position = state.positionAtIndex(index);

        return Number.isFinite(position) ? position : undefined;
      },
      rowHeight: index => {
        const size = state.sizeAtIndex(index);

        return Number.isFinite(size) && size > 0 ? size : undefined;
      },
      visibleRange: { start: state.start, end: state.end },
    };
  }, [listRef]);

  return useMemo(
    () => ({ read, setViewport, getWidth }),
    [read, setViewport, getWidth],
  );
};
