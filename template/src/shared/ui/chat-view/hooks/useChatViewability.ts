import type {
  ViewabilityConfigCallbackPairs,
  ViewToken,
} from "@legendapp/list/react-native";
import { RefObject, useCallback, useMemo } from "react";
import { SharedValue } from "react-native-reanimated";

import { ChatRow } from "../data";
import { ChatViewProps } from "../types";

/**
 * Видимость сообщений — две пары порогов для списка.
 *
 * Чату нужны два разных порога: более строгий для снимка видимых и более мягкий
 * для отметки о прочтении. Список умеет и то и другое сразу
 * (`viewabilityConfigCallbackPairs`), поэтому долю видимости больше не нужно
 * считать вручную по геометрии на каждом кадре скролла — вместе с ней ушёл и
 * ручной гистерезис: его роль играет `minimumViewTime`.
 */

/** Значения по умолчанию совпадают с нативной реализацией. */
const DEFAULT_VISIBLE_THRESHOLD = 0.8;
const DEFAULT_UNREAD_THRESHOLD = 0.5;
const DEFAULT_VISIBLE_INTERVAL = 0.3;
const DEFAULT_UNREAD_INTERVAL = 0.3;

export interface IChatViewabilityOptions {
  props: RefObject<ChatViewProps>;
  /** Признак «у нижнего края», который ведёт сам список. */
  isNearEnd: SharedValue<boolean>;
  /** Отметить прочитанными во внутреннем счётчике. */
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

  // Пропы задают долю 0..1, список — проценты.
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
