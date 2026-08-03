import type { LegendListRef } from "@legendapp/list/react-native";

import { ChatRow } from "../data";
import { IChatScrollAnchor } from "../types";

/**
 * Якорь позиции — семантика нативного `ScrollAnchor`:
 *   offset = visibleBottom − cellBottom  (от низа видимой области до низа ячейки)
 *   restore = cellBottom + offset − scrollLength + bottomInset
 *
 * Нижнее видимое сообщение, любой знак offset (отрицательный ← частично за панелью).
 * Только измеренная строка: `sizeAtIndex` на оценке уводил бы позицию при открытии.
 */

export interface IAnchorScrollIndex {
  index: number;
  viewPosition: number;
  viewOffset: number;
}

/** Снять якорь с текущей позиции списка — нижнее видимое сообщение. */
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

  // Идём снизу вверх: нижнее видимое сообщение — якорь. Нативный код не
  // фильтрует offset: ячейка может быть частично за панелью (отрицательный
  // offset), и это нормально — restoreScrollAnchor обрабатывает любой знак.
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

/** Декларативная цель для `initialScrollIndex` — по оценочным высотам. */
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

/** Точное смещение по измеренным высотам. `null` — строка ещё не измерена. */
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
