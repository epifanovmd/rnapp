import { IAnchorListRef } from "@epifanovmd/anchor-list";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/** Сколько держится подсветка сообщения, к которому перешли. */
const HIGHLIGHT_DURATION = 2000;

/** Отступ цитаты от верхней кромки после перехода. */
const QUOTE_VIEW_OFFSET = 12;

export interface IChatQuoteNavigationOptions {
  listRef: RefObject<IAnchorListRef | null>;
}

export interface IChatQuoteNavigation {
  /** Сообщение, к которому только что перешли; уходит в `extraData` списка. */
  highlightedId?: string;
  /** Перейти к сообщению по id. Возвращает `false`, если его нет в данных. */
  jumpToMessage: (messageId: string) => boolean;
}

/**
 * Переход к цитируемому сообщению.
 *
 * Адресуется ключом, а не индексом: после подгрузки истории у того же
 * сообщения индекс другой, а ключ тот же. `false` означает, что сообщения нет
 * в загруженном окне — здесь это конец истории, в переписке с пагинацией
 * отсюда подтягивают контекст вокруг него.
 */
export const useChatQuoteNavigation = ({
  listRef,
}: IChatQuoteNavigationOptions): IChatQuoteNavigation => {
  const [highlightedId, setHighlightedId] = useState<string | undefined>(
    undefined,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jumpToMessage = useCallback(
    (messageId: string) => {
      const found = listRef.current?.scrollToKey({
        key: messageId,
        viewPosition: 0,
        viewOffset: QUOTE_VIEW_OFFSET,
        animated: true,
      });

      if (!found) return false;

      setHighlightedId(messageId);

      if (timer.current) clearTimeout(timer.current);

      timer.current = setTimeout(
        () => setHighlightedId(undefined),
        HIGHLIGHT_DURATION,
      );

      return true;
    },
    [listRef],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return useMemo(
    () => ({ highlightedId, jumpToMessage }),
    [highlightedId, jumpToMessage],
  );
};
