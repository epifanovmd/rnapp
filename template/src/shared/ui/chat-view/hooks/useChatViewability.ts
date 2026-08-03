import type {
  ViewabilityConfigCallbackPairs,
  ViewToken,
} from "@legendapp/list/react-native";
import { RefObject, useCallback, useMemo, useRef } from "react";
import { SharedValue } from "react-native-reanimated";

import { useLatestRef } from "../../../lib/hooks";
import { ChatRow } from "../data";
import { ChatViewProps } from "../types";

/** Значения по умолчанию совпадают с нативной реализацией. */
const DEFAULT_VISIBLE_THRESHOLD = 0.8;
const DEFAULT_UNREAD_THRESHOLD = 0.5;
const DEFAULT_VISIBLE_INTERVAL = 0.3;
const DEFAULT_UNREAD_INTERVAL = 0.3;

/**
 * Два порога видимости сразу: строгий для снимка видимых сообщений и мягкий
 * для отметки о прочтении. Считает их сам список через
 * `viewabilityConfigCallbackPairs`.
 *
 * `minimumViewTime` в каждом конфиге — это не глобальный дебаунс, а
 * **порог на элемент**: строка должна провисеть в зоне видимости дольше этого
 * времени, чтобы попасть в срез. При быстром броске строки проносятся мимо
 * быстрее порога и не попадают — это правильное поведение, менять его не надо.
 *
 * Что добавлено поверх штатной механики списка:
 *
 * 1. **Дедупликация среза видимых**: если тот же набор messageId, что и в
 *    прошлый раз, событие наружу не уходит. Без неё хост на каждый тик пишет
 *    в хранилище один и тот же список — видимые сообщения при медленном
 *    скролле почти не меняются.
 *
 * 2. **Стабильные колбэки**: `handleVisible`/`handleRead` не пересоздаются при
 *    смене `props` или `isNearEnd` — вместо этого читают актуальные значения
 *    из `useLatestRef`. Иначе LegendList перерегистрирует `viewabilityConfig`
 *    на каждый ререндер.
 */
export interface IChatViewabilityOptions {
  props: RefObject<ChatViewProps>;
  isNearEnd: SharedValue<boolean>;
  onMarkRead: (ids: readonly string[]) => void;
  visibilityThreshold?: number;
  unreadVisibilityThreshold?: number;
  visibleInterval?: number;
  unreadInterval?: number;
}

export const useChatViewability = ({
  props,
  isNearEnd,
  onMarkRead,
  visibilityThreshold = DEFAULT_VISIBLE_THRESHOLD,
  unreadVisibilityThreshold = DEFAULT_UNREAD_THRESHOLD,
  visibleInterval = DEFAULT_VISIBLE_INTERVAL,
  unreadInterval = DEFAULT_UNREAD_INTERVAL,
}: IChatViewabilityOptions): ViewabilityConfigCallbackPairs<ChatRow> => {
  const propsRef = useLatestRef(props.current);
  const onMarkReadRef = useLatestRef(onMarkRead);
  const lastVisibleIdsRef = useRef<string>("");

  const handleVisible = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<ChatRow>[] }) => {
      const messageIds: string[] = [];

      for (const { item } of viewableItems) {
        if (item.type === "message") messageIds.push(item.message.id);
      }

      if (messageIds.length === 0) return;

      // Сортировка для стабильного сравнения: список может отдать id в
      // разном порядке (особенно при recycleItems), и один и тот же набор
      // строк выглядел бы как новый.
      const key = messageIds.sort().join(",");

      if (key === lastVisibleIdsRef.current) return;

      lastVisibleIdsRef.current = key;

      propsRef.current.onVisibleMessagesChange?.({
        messageIds,
        isAtBottom: isNearEnd.value,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleRead = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<ChatRow>[] }) => {
      const unreadIds: string[] = [];

      for (const { item } of viewableItems) {
        if (
          item.type === "message" &&
          item.message.ownership === "theirs" &&
          item.message.status !== "read"
        ) {
          unreadIds.push(item.message.id);
        }
      }

      if (unreadIds.length === 0) return;

      onMarkReadRef.current(unreadIds);
      propsRef.current.onUnreadMessagesAppear?.({ messageIds: unreadIds });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return useMemo(
    () => [
      {
        viewabilityConfig: {
          id: "visible",
          itemVisiblePercentThreshold: visibilityThreshold * 100,
          minimumViewTime: visibleInterval * 1000,
        },
        onViewableItemsChanged: handleVisible,
      },
      {
        viewabilityConfig: {
          id: "read",
          itemVisiblePercentThreshold: unreadVisibilityThreshold * 100,
          minimumViewTime: unreadInterval * 1000,
        },
        onViewableItemsChanged: handleRead,
      },
    ],
    [
      visibilityThreshold,
      visibleInterval,
      unreadVisibilityThreshold,
      unreadInterval,
      handleVisible,
      handleRead,
    ],
  );
};
