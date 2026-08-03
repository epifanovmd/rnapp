import type {
  ViewabilityConfigCallbackPairs,
  ViewToken,
} from "@legendapp/list/react-native";
import { RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { SharedValue } from "react-native-reanimated";

import { useLatestRef } from "../../../lib/hooks";
import { ChatRow } from "../data";
import { ChatViewProps } from "../types";

const DEFAULT_VISIBLE_THRESHOLD = 0.8;
const DEFAULT_UNREAD_THRESHOLD = 0.5;
const DEFAULT_VISIBLE_INTERVAL = 0.3;
const DEFAULT_UNREAD_INTERVAL = 0.3;

/**
 * Два порога видимости через `viewabilityConfigCallbackPairs`:
 * строгий для снимка видимых и мягкий для отметки о прочтении.
 *
 * `handleVisible` — дедупликация по набору id.
 * `handleRead` — mark-as-read сразу, `onUnreadMessagesAppear` с батчингом
 * (дебаунс + аккумуляция за интервал), как в нативном `notifyUnreadMessages`.
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

  const pendingUnreadRef = useRef<Set<string>>(new Set());
  const unreadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushUnread = useCallback(() => {
    if (unreadTimerRef.current != null) {
      clearTimeout(unreadTimerRef.current);
      unreadTimerRef.current = null;
    }

    const batch = pendingUnreadRef.current;

    if (batch.size === 0) return;

    const ids = Array.from(batch);

    pendingUnreadRef.current = new Set();
    propsRef.current.onUnreadMessagesAppear?.({ messageIds: ids });
  }, [propsRef]);

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

      // mark-as-read — сразу.
      onMarkReadRef.current(unreadIds);

      // onUnreadMessagesAppear — батчинг с дебаунсом, как в нативе.
      for (const id of unreadIds) {
        pendingUnreadRef.current.add(id);
      }

      if (unreadTimerRef.current != null) clearTimeout(unreadTimerRef.current);
      unreadTimerRef.current = setTimeout(flushUnread, unreadInterval * 1000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => () => flushUnread(), [flushUnread]);

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
