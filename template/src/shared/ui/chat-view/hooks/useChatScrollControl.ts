import type { LegendListRef } from "@legendapp/list/react-native";
import { RefObject, useEffect, useMemo, useRef } from "react";

import { IChatData } from "../data";
import { ChatHighlightStore } from "../model";
import { ChatScrollPosition } from "../types";

/**
 * Управление скроллом.
 *
 * Единственное место, которое двигает список. Восстановления позиции по якорям
 * здесь больше нет: её держит сам список — `maintainVisibleContentPosition`
 * при вставках выше вьюпорта и `maintainScrollAtEnd`, когда мы у нижнего края.
 */

/** Пауза перед подсветкой: сообщение должно доехать до места. */
const HIGHLIGHT_DELAY_ANIMATED = 350;
const HIGHLIGHT_DELAY_INSTANT = 100;

export interface IChatScrollToMessageOptions {
  position?: ChatScrollPosition;
  animated?: boolean;
  highlight?: boolean;
}

export interface IChatScrollControl {
  scrollToBottom: (animated?: boolean) => void;
  scrollToMessage: (
    messageId: string,
    options?: IChatScrollToMessageOptions,
  ) => void;
  /**
   * Поставить строку нижним краем к низу видимой области.
   *
   * Нужно для восстановления якоря: `initialScrollIndex` применяется на первом
   * layout, когда высоты строк ещё оценочные (`estimatedItemSize`), и на
   * длинной истории накопленная ошибка достигает экрана. Нативная реализация
   * этого не знает — она считает позицию после `layoutIfNeeded()`, по реальным
   * высотам. Здесь тот же приём: доуточнить позицию, когда строки измерены.
   */
  alignMessageToBottom: (messageId: string, offset: number) => void;
}

export interface IChatScrollControlOptions {
  listRef: RefObject<LegendListRef | null>;
  data: RefObject<IChatData>;
  highlight: ChatHighlightStore;
  /**
   * Перекрытие контента снизу (клавиатура + панель ввода). Нужно
   * `scrollToMessage`, чтобы центрировать сообщение по **видимой** области:
   * при открытой клавиатуре видимый центр выше, и без поправки сообщение
   * уходит под клавиатуру.
   */
  getBottomInset: () => number;
}

const VIEW_POSITIONS: Record<ChatScrollPosition, number> = {
  top: 0,
  center: 0.5,
  bottom: 1,
};

export const useChatScrollControl = ({
  listRef,
  data,
  highlight,
  getBottomInset,
}: IChatScrollControlOptions): IChatScrollControl => {
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    },
    [],
  );

  return useMemo<IChatScrollControl>(
    () => ({
      scrollToBottom: (animated = true) =>
        listRef.current?.scrollToEnd({ animated }),

      scrollToMessage: (messageId, options = {}) => {
        const {
          position = "center",
          animated = true,
          highlight: shouldHighlight = true,
        } = options;
        const index = data.current.rowIndexOf(messageId);

        if (index == null) return;

        const viewPosition = VIEW_POSITIONS[position];

        // Список центрирует элемент в полном вьюпорте, но при открытой
        // клавиатуре видимая область короче на нижнее перекрытие.
        // Отрицательный `viewOffset` возвращает элемент в видимый центр.
        listRef.current?.scrollToIndex({
          index,
          animated,
          viewPosition,
          viewOffset: -viewPosition * getBottomInset(),
        });

        if (!shouldHighlight) return;

        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(
          () => highlight.highlight(messageId),
          animated ? HIGHLIGHT_DELAY_ANIMATED : HIGHLIGHT_DELAY_INSTANT,
        );
      },

      alignMessageToBottom: (messageId, offset) => {
        const list = listRef.current;
        const index = data.current.rowIndexOf(messageId);

        if (!list || index == null) return;

        const state = list.getState();
        const top = state.positionAtIndex(index);
        const size = state.sizeAtIndex(index);

        if (!Number.isFinite(top) || !Number.isFinite(size)) return;

        // Целевое смещение считаем сами — из тех же `positionAtIndex` и
        // `sizeAtIndex`, по которым якорь и сохранялся. Это обратная функция к
        // `computeAnchor`, один в один как в нативной реализации:
        //
        //   сохранение: offset = scroll + scrollLength - bottomInset - cellBottom
        //   восстановление: scroll = cellBottom + offset - scrollLength + bottomInset
        //
        // Через `scrollToIndex` этого делать нельзя: там к результату
        // примешиваются внутренние поправки списка (`trailingInset`,
        // `topOffsetAdjustment`), которых нет в сохранении. Они не сокращаются,
        // и каждый круг «сохранил → открыл» уводил позицию на их сумму —
        // ошибка накапливалась с каждым открытием чата.
        const target =
          top + size + offset - state.scrollLength + getBottomInset();
        const maxOffset = Math.max(0, state.contentLength - state.scrollLength);

        list.scrollToOffset({
          offset: Math.min(Math.max(target, 0), maxOffset),
          animated: false,
        });
      },
    }),
    [listRef, data, highlight, getBottomInset],
  );
};
