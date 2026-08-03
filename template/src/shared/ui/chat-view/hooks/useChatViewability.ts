import type {
  ViewabilityConfigCallbackPairs,
  ViewToken,
} from "@legendapp/list/react-native";
import { RefObject, useCallback, useMemo } from "react";
import { SharedValue } from "react-native-reanimated";

import { ChatRow } from "../data";
import { ChatViewProps } from "../types";

/** Значения по умолчанию совпадают с нативной реализацией. */
const DEFAULT_VISIBLE_THRESHOLD = 0.8;
const DEFAULT_UNREAD_THRESHOLD = 0.5;
const DEFAULT_VISIBLE_INTERVAL = 0.3;
const DEFAULT_UNREAD_INTERVAL = 0.3;

/**
 * Два порога видимости сразу: строгий для снимка видимых сообщений и мягкий
 * для отметки о прочтении. Считает их сам список.
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
  const handleVisible = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<ChatRow>[] }) => {
      const messageIds: string[] = [];

      for (const { item } of viewableItems) {
        if (item.type === "message") messageIds.push(item.message.id);
      }

      if (messageIds.length === 0) return;

      props.current.onVisibleMessagesChange?.({
        messageIds,
        isAtBottom: isNearEnd.value,
      });
    },
    [props, isNearEnd],
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

      onMarkRead(unreadIds);
      props.current.onUnreadMessagesAppear?.({ messageIds: unreadIds });
    },
    [props, onMarkRead],
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
