import { useCallback, useEffect, useRef } from "react";

import { ChatOverlayStore } from "../components/chat-overlay-store";
import {
  getSectionTitle,
  IChatGeometry,
  IChatViewLayout,
  IDateSeparatorPosition,
  resolveFloatingDate,
} from "../model";

/**
 * Плавающая дата — порт `FloatingDateManager` (сторона состояния).
 *
 * Расчёт живёт в `resolveFloatingDate` (чистая функция), здесь остаётся
 * только то, что расчётом быть не может: таймер автоскрытия и запись в
 * стор оверлеев. Стор внешний, поэтому обновление плашки на каждом кадре
 * скролла не перерисовывает ни чат, ни список.
 */

export interface IChatFloatingDateOptions {
  readGeometry: () => IChatGeometry;
  getSeparators: () => IDateSeparatorPosition[];
  getLayout: () => IChatViewLayout;
  isEnabled: () => boolean;
  hasMessages: () => boolean;
  /** Дополнительный верхний отступ чата. Порт `collectionExtraInsetTop`. */
  getTopInset: () => number;
  store: ChatOverlayStore;
}

export const useChatFloatingDate = ({
  readGeometry,
  getSeparators,
  getLayout,
  isEnabled,
  hasMessages,
  getTopInset,
  store,
}: IChatFloatingDateOptions) => {
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentDateRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    },
    [],
  );

  return useCallback(() => {
    if (!isEnabled() || !hasMessages()) {
      currentDateRef.current = null;
      store.set({ floatingDateVisible: false });

      return;
    }

    const layout = getLayout();
    // Порт dateSeparatorHeight: высота строки ≈ 1.3 кегля плюс вертикальные
    // отступы плашки.
    const pillHeight =
      layout.dateSeparatorFont.fontSize * 1.3 + layout.dateSeparatorVPad * 2;

    const { groupDate, pushOffset } = resolveFloatingDate({
      geometry: readGeometry(),
      separators: getSeparators(),
      // Позиция покоя плашки: отступ секции плюс верхний инсет чата.
      pillRestY: layout.sectionSpacing + getTopInset(),
      pillHeight,
      spacing: layout.sectionSpacing,
    });

    if (!groupDate) {
      currentDateRef.current = null;
      store.set({ floatingDateVisible: false, floatingDatePush: 0 });

      return;
    }

    if (groupDate !== currentDateRef.current) {
      currentDateRef.current = groupDate;
      store.set({ floatingDateTitle: getSectionTitle(groupDate) });
    }

    store.set({ floatingDateVisible: true, floatingDatePush: pushOffset });

    // Порт show(): плашка гаснет сама через floatingDateHideDelay.
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      store.set({ floatingDateVisible: false });
    }, layout.floatingDateHideDelay * 1000);
  }, [
    isEnabled,
    hasMessages,
    getLayout,
    readGeometry,
    getSeparators,
    getTopInset,
    store,
  ]);
};
