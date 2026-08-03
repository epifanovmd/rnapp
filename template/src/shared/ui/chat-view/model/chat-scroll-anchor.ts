import type { LegendListRef } from "@legendapp/list/react-native";

import { ChatRow } from "../data";
import { IChatScrollAnchor } from "../types";

/**
 * Якорь позиции чата: нижнее видимое сообщение и расстояние от него до низа
 * видимой области.
 *
 * Сохранение и восстановление — одна формула в две стороны, поэтому живут
 * рядом: разойдясь, они дают сдвиг, накапливающийся с каждым открытием чата.
 *
 *   offset = scroll + scrollLength − bottomInset − cellBottom
 *   scroll = cellBottom + offset − scrollLength + bottomInset
 *
 * `bottomInset` — перекрытие снизу (клавиатура и панель ввода): видимая область
 * заканчивается над панелью, а не у края экрана. Привязка идёт к сообщению, а
 * не к индексу: индекс плывёт при вставках сверху.
 */

export interface IAnchorScrollIndex {
  index: number;
  viewPosition: number;
  viewOffset: number;
}

/** Снять якорь с текущей позиции списка. */
export const readScrollAnchor = (
  list: LegendListRef | null,
  rows: ChatRow[],
  isAtBottom: boolean,
  bottomInset: number,
): IChatScrollAnchor | null => {
  const state = list?.getState();

  if (!state) return null;

  if (isAtBottom) {
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];

      if (row.type === "message") {
        return { messageId: row.message.id, offset: 0, wasAtBottom: true };
      }
    }

    return null;
  }

  const visibleBottom = state.scroll + state.scrollLength - bottomInset;

  for (let i = state.end; i >= state.start; i--) {
    const row = rows[i];

    if (!row || row.type !== "message") continue;

    const top = state.positionAtIndex(i);
    const size = state.sizeAtIndex(i);

    if (!Number.isFinite(top) || !Number.isFinite(size)) continue;

    return {
      messageId: row.message.id,
      offset: visibleBottom - (top + size),
      wasAtBottom: false,
    };
  }

  return null;
};

/**
 * Декларативная начальная цель списка — приближение по оценочным высотам строк.
 *
 * `bottomInset` прибавляется, хотя список и вычитает свой инсет сам: на момент
 * разрешения этой цели он его ещё не знает — инсет приходит от нативного
 * скролла после его лейаута. `contentPaddingTop` компенсирует
 * `topOffsetAdjustment`, которого нет в якоре.
 */
export const resolveAnchorScrollIndex = (
  index: number,
  anchor: IChatScrollAnchor,
  contentPaddingTop: number,
  bottomInset: number,
): IAnchorScrollIndex => ({
  index,
  viewPosition: 1,
  viewOffset: -(anchor.offset + bottomInset) + contentPaddingTop,
});

/**
 * Точное смещение по якорю — по уже измеренным высотам строк.
 *
 * Считается напрямую, а не через `scrollToIndex`: там к результату примешаны
 * внутренние поправки списка, которых нет в сохранении, и каждый круг
 * «сохранил → открыл» уводил бы позицию на их сумму.
 */
export const resolveAnchorScrollOffset = (
  list: LegendListRef,
  index: number,
  anchorOffset: number,
  bottomInset: number,
): number | null => {
  const state = list.getState();
  const top = state.positionAtIndex(index);
  const size = state.sizeAtIndex(index);

  if (!Number.isFinite(top) || !Number.isFinite(size)) return null;

  const target = top + size + anchorOffset - state.scrollLength + bottomInset;
  const maxOffset = Math.max(0, state.contentLength - state.scrollLength);

  return Math.min(Math.max(target, 0), maxOffset);
};
