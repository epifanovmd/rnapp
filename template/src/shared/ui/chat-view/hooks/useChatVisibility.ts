import type { ViewToken } from "@legendapp/list/react-native";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { ChatRow } from "../data";
import {
  ChatVisibilityTracker,
  IChatGeometry,
  IVisibilityThresholds,
  IVisibleItem,
  rowBottom,
} from "../scroll";

/**
 * Видимость сообщений — мост между списком и `ChatVisibilityTracker`.
 *
 * `LegendList` сообщает лишь «видимо / не видимо» по одному порогу, а эталону
 * нужна **доля видимости** каждой ячейки: на ней держатся гистерезис и
 * отдельный порог прочитанности. Поэтому доля считается здесь по геометрии —
 * как эталон считает `visibleRect ∩ cellFrame`.
 */

export interface IChatVisibilityOptions {
  readGeometry: () => IChatGeometry;
  getRows: () => ChatRow[];
  getThresholds: () => IVisibilityThresholds;
  onVisibleChange: (messageIds: string[]) => void;
  onUnreadAppear: (messageIds: string[]) => void;
  onMarkAsRead: (messageIds: Set<string>) => void;
}

/** Доля видимой части строки. Порт `intersection.height / cellFrame.height`. */
const visibleFractionOf = (
  geometry: IChatGeometry,
  index: number,
): number | null => {
  const top = geometry.rowTop(index);
  const bottom = rowBottom(geometry, index);

  if (top == null || bottom == null) return null;

  const height = bottom - top;

  if (height <= 0) return null;

  const viewportTop = geometry.scrollY;
  const viewportBottom = viewportTop + geometry.viewportHeight;

  const intersection =
    Math.min(bottom, viewportBottom) - Math.max(top, viewportTop);

  if (intersection <= 0) return 0;

  return Math.min(1, intersection / height);
};

export const useChatVisibility = ({
  readGeometry,
  getRows,
  getThresholds,
  onVisibleChange,
  onUnreadAppear,
  onMarkAsRead,
}: IChatVisibilityOptions) => {
  const trackerRef = useRef<ChatVisibilityTracker | null>(null);

  // Трекер создаётся один раз: состояние гистерезиса обязано пережить
  // смену пропов, поэтому пороги и колбэки он читает через геттеры.
  if (!trackerRef.current) {
    trackerRef.current = new ChatVisibilityTracker({
      getThresholds,
      onVisibleChange,
      onUnreadAppear,
      onMarkAsRead,
    });
  }

  const tracker = trackerRef.current;

  useEffect(() => () => tracker.dispose(), [tracker]);

  /**
   * Пересчёт по текущей геометрии. Вызывается и из `onViewableItemsChanged`,
   * и из `onScroll`: доля видимости меняется непрерывно, а список шлёт
   * событие только при пересечении своего порога.
   */
  const recompute = useCallback(() => {
    const geometry = readGeometry();
    const rows = getRows();
    const { start, end } = geometry.visibleRange;

    if (end < start) return;

    // Массив собирается уже отсортированным по индексу — трекер это
    // использует и не сортирует повторно.
    const items: IVisibleItem[] = [];

    for (let index = start; index <= end; index++) {
      const row = rows[index];

      if (!row || row.type !== "message") continue;

      const fraction = visibleFractionOf(geometry, index);

      if (fraction == null) continue;

      items.push({ index, message: row.message, visibleFraction: fraction });
    }

    if (items.length > 0) tracker.update(items);
  }, [readGeometry, getRows, tracker]);

  const onViewableItemsChanged = useCallback(
    (_info: { viewableItems: ViewToken<ChatRow>[] }) => {
      recompute();
    },
    [recompute],
  );

  return useMemo(
    () => ({ recompute, onViewableItemsChanged }),
    [recompute, onViewableItemsChanged],
  );
};
