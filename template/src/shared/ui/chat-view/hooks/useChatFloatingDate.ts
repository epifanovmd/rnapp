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
 *
 * Единственная величина, которая действительно меняется каждый кадр —
 * сдвиг плашки — уходит в shared value стора и React не касается вовсе.
 * В состояние пишутся только видимость и заголовок, а `store.set`
 * гасит повторы, так что обычный кадр скролла не даёт ни одного ре-рендера.
 */

/**
 * Как часто перевзводится таймер автоскрытия. Взводить его на каждом кадре
 * — это 60 таймеров в секунду ради того же самого эффекта.
 */
const HIDE_TIMER_REARM_MS = 100;

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
  const lastRearmAtRef = useRef(0);

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

    // Сдвиг меняется каждый кадр — пишем напрямую в shared value.
    store.floatingDatePush.value = pushOffset;

    if (!groupDate) {
      currentDateRef.current = null;
      store.set({ floatingDateVisible: false });

      return;
    }

    if (groupDate !== currentDateRef.current) {
      currentDateRef.current = groupDate;
      store.set({ floatingDateTitle: getSectionTitle(groupDate) });
    }

    store.set({ floatingDateVisible: true });

    // Порт show(): плашка гаснет сама через floatingDateHideDelay. Таймер
    // не взводится заново на каждом кадре скролла — только не чаще чем
    // раз в HIDE_TIMER_REARM_MS: эффект тот же, а 60 таймеров в секунду
    // чистить не нужно.
    const now = Date.now();

    if (now - lastRearmAtRef.current >= HIDE_TIMER_REARM_MS) {
      lastRearmAtRef.current = now;

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        hideTimerRef.current = null;
        store.set({ floatingDateVisible: false });
      }, layout.floatingDateHideDelay * 1000);
    }
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
