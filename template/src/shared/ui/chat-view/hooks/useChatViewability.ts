import type {
  ViewabilityConfigCallbackPairs,
  ViewToken,
} from "@legendapp/list/react-native";
import { RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { SharedValue } from "react-native-reanimated";

import { useLatestRef } from "../../../lib/hooks";
import { ChatRow } from "../data";
import { ChatViewProps } from "../types";

/** Доля видимости ячейки: строгая для снимка видимых, мягкая для прочтения. */
const VISIBLE_PERCENT = 80;
const UNREAD_PERCENT = 50;
/** Сколько ячейка должна пробыть видимой, прежде чем попасть в снимок (мс). */
const VISIBLE_TIME_MS = 300;
/** Дебаунс пачки непрочитанных перед выдачей наружу (мс). */
const UNREAD_DEBOUNCE_MS = 300;

/** Блокировка коллбэков на время начального позиционирования списка. */
const INITIAL_PROTECTION_MS = 1000;

/**
 * Два порога видимости: строгий для снимка видимых, мягкий для отметки о прочтении.
 * На время начальной защиты коллбэки не вызываются.
 */
export interface IChatViewabilityOptions {
  props: RefObject<ChatViewProps>;
  isNearEnd: SharedValue<boolean>;
  onMarkRead: (ids: readonly string[]) => void;
}

export const useChatViewability = ({
  props,
  isNearEnd,
  onMarkRead,
}: IChatViewabilityOptions): ViewabilityConfigCallbackPairs<ChatRow> => {
  const propsRef = useLatestRef(props.current);
  const onMarkReadRef = useLatestRef(onMarkRead);
  const lastVisibleIdsRef = useRef<string>("");

  const pendingUnreadRef = useRef<Set<string>>(new Set());
  const unreadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Блокирует коллбэки на время начального позиционирования. */
  const isInitialScrollProtectedRef = useRef(true);

  useEffect(() => {
    const id = setTimeout(() => {
      isInitialScrollProtectedRef.current = false;
    }, INITIAL_PROTECTION_MS);

    return () => clearTimeout(id);
  }, []);

  const flushUnread = useCallback(() => {
    if (unreadTimerRef.current != null) {
      clearTimeout(unreadTimerRef.current);
      unreadTimerRef.current = null;
    }

    const batch = pendingUnreadRef.current;

    if (batch.size === 0) return;

    const ids = Array.from(batch);

    pendingUnreadRef.current = new Set();
    propsRef.current.onUnreadMessagesAppear?.(ids);
  }, [propsRef]);

  const handleVisible = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<ChatRow>[] }) => {
      if (isInitialScrollProtectedRef.current) return;

      const messageIds: string[] = [];

      for (const { item } of viewableItems) {
        if (item.type === "message") messageIds.push(item.message.id);
      }

      if (messageIds.length === 0) return;

      const key = messageIds.sort().join(",");

      if (key === lastVisibleIdsRef.current) return;

      lastVisibleIdsRef.current = key;

      propsRef.current.onVisibleMessagesChange?.(messageIds, isNearEnd.value);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleRead = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<ChatRow>[] }) => {
      if (isInitialScrollProtectedRef.current) return;

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

      for (const id of unreadIds) {
        pendingUnreadRef.current.add(id);
      }

      if (unreadTimerRef.current != null) clearTimeout(unreadTimerRef.current);
      unreadTimerRef.current = setTimeout(flushUnread, UNREAD_DEBOUNCE_MS);
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
          itemVisiblePercentThreshold: VISIBLE_PERCENT,
          minimumViewTime: VISIBLE_TIME_MS,
        },
        onViewableItemsChanged: handleVisible,
      },
      {
        viewabilityConfig: {
          id: "read",
          itemVisiblePercentThreshold: UNREAD_PERCENT,
          minimumViewTime: UNREAD_DEBOUNCE_MS,
        },
        onViewableItemsChanged: handleRead,
      },
    ],
    [handleVisible, handleRead],
  );
};
