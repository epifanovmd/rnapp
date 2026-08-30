import {
  AnchorListInitialScroll,
  IAnchorListRef,
} from "@epifanovmd/anchor-list";
import { useFocusEffect } from "@react-navigation/native";
import { IStorageService } from "@shared/lib/storage";
import { RefObject, useCallback, useMemo, useRef, useState } from "react";

import { ChatRow } from "./chat-rows";
import {
  chatInitialScroll,
  chatScrollOffset,
  ChatScrollPosition,
  chatScrollStorageKey,
  parseChatScrollPosition,
  serializeChatScrollPosition,
} from "./chat-scroll-position";

/**
 * Позиция списка между открытиями экрана.
 *
 * Читается ровно один раз и синхронно: стартовая позиция нужна к первому кадру,
 * после асинхронного чтения список успел бы открыться у конца и дёрнуться.
 * Возвращается она пропом `initialScroll`, а не методом ref, по той же причине.
 */

export interface IChatScrollRestoreOptions {
  /** Переписка: под её ключом лежит позиция. */
  chatId: string;
  rows: readonly ChatRow[];
  listRef: RefObject<IAnchorListRef | null>;
}

export interface IChatScrollRestore {
  initialScroll: AnchorListInitialScroll;
  /**
   * Снять позицию прямо сейчас — подключается к `onScrollEndDrag`.
   *
   * Палец отпущен: за жестом ещё может идти инерция, поэтому снимок здесь
   * промежуточный. Окончательный снимается при уходе с экрана и перекрывает
   * его.
   */
  capturePosition: () => void;
}

export const useChatScrollRestore = ({
  chatId,
  rows,
  listRef,
}: IChatScrollRestoreOptions): IChatScrollRestore => {
  const storage = IStorageService.useInstance();
  const storageKey = chatScrollStorageKey(chatId);

  const [saved] = useState<ChatScrollPosition | undefined>(() =>
    parseChatScrollPosition(storage.getItem(storageKey)),
  );

  const initialScroll = useMemo(
    () => chatInitialScroll(rows, saved),
    [rows, saved],
  );

  /**
   * Последний снятый снимок.
   *
   * Копится в ref, а в хранилище уходит по уходу с экрана: писать на каждое
   * движение незачем, а снимать позицию во время скролла бессмысленно — за
   * броском идёт инерция, и окончательная позиция известна только после неё.
   */
  const snapshot = useRef<ChatScrollPosition | undefined>(undefined);

  const capturePosition = useCallback(() => {
    const list = listRef.current;

    if (!list) return;

    const range = list.getVisibleRange();
    const topIndex = range.start;
    const position = list.getPositionAtIndex(topIndex);
    const row = rows[topIndex];
    // Последняя строка на экране — значит стояли у конца переписки. Возвращать
    // туда нужно к концу контента, а не к строке: к следующему открытию она уже
    // не последняя.
    const isAtEnd = range.end >= rows.length - 1;

    if (isAtEnd) {
      snapshot.current = { type: "end" };

      return;
    }

    if (position === undefined || !row) return;

    snapshot.current = {
      type: "row",
      key: row.key,
      offset: chatScrollOffset(position, list.getScrollOffset()),
    };
  }, [listRef, rows]);

  /** Последнее записанное значение — по нему отсекается повторная запись. */
  const written = useRef<string | undefined>(undefined);

  const writeSnapshot = useCallback(() => {
    if (!snapshot.current) return;

    const value = serializeChatScrollPosition(snapshot.current);

    if (value === written.current) return;

    written.current = value;
    storage.setItem(storageKey, value);
  }, [storage, storageKey]);

  /**
   * Уход с экрана — единственный момент записи: снимок снимается живым и
   * перекрывает всё, что было снято раньше, в том числе позицию, пойманную
   * посреди инерции.
   *
   * Именно потеря фокуса, а не размонтирование: `useImperativeHandle` чистит
   * ref в фазе layout-эффектов, и к очистке обычного эффекта спрашивать уже
   * некого. Уход по стеку даёт и потерю фокуса, и размонтирование — очистка
   * отработает дважды, поэтому повторная запись того же значения отсекается.
   */
  useFocusEffect(
    useCallback(
      () => () => {
        capturePosition();
        writeSnapshot();
      },
      [capturePosition, writeSnapshot],
    ),
  );

  return useMemo(
    () => ({ initialScroll, capturePosition }),
    [initialScroll, capturePosition],
  );
};
