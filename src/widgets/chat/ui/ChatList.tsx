import { IChatMessage } from "@entities/message";
import {
  AnchorList,
  AnchorListInitialScroll,
  IAnchorListRef,
  IAnchorListRenderItemProps,
  IAnchorListStickyConfig,
} from "@epifanovmd/anchor-list";
import { MessageActionId } from "@features/message-actions";
import React, { forwardRef, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { SharedValue } from "react-native-reanimated";

import {
  CHAT_ESTIMATED_ROW_SIZE,
  ChatRow,
  chatRowFixedSize,
  chatRowKey,
  chatRowType,
} from "../model/chat-rows";
import { ChatDayRow } from "./ChatDayRow";
import { ChatMessageRow } from "./ChatMessageRow";

export interface IChatListProps {
  rows: readonly ChatRow[];
  /** Индексы разделителей дат — якоря прилипания к верхней кромке. */
  dayIndices: number[];
  /** Сообщения по id: строка достаёт отсюда цитату. */
  messagesById: Map<string, IChatMessage>;
  /** Перекрытие снизу: панель ввода и клавиатура. */
  insetEnd: SharedValue<number>;
  /** Список у конца — сюда список пишет сам, отсюда читает кнопка «вниз». */
  isAtEnd: SharedValue<boolean>;
  initialScroll: AnchorListInitialScroll;
  /** Сообщение, подсвеченное после перехода по цитате. */
  highlightedId?: string;
  onAction: (action: MessageActionId, message: IChatMessage) => void;
  onQuotePress: (messageId: string) => void;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  onScrollEndDrag?: () => void;
  /** Скролл дошёл до начала истории — место для подгрузки прошлых страниц. */
  onStartReached?: () => void;
}

/**
 * Список сообщений.
 *
 * Занимается только показом строк: данные, действия и переходы приходят
 * сверху. Всё, что упирается в низ экрана, считается от одного `insetEnd` —
 * распорку, подъём смещения и отступ индикатора список делает сам.
 */
export const ChatList = forwardRef<IAnchorListRef, IChatListProps>(
  (
    {
      rows,
      dayIndices,
      messagesById,
      insetEnd,
      isAtEnd,
      initialScroll,
      highlightedId,
      onAction,
      onQuotePress,
      onMenuOpen,
      onMenuClose,
      onScrollEndDrag,
      onStartReached,
    },
    ref,
  ) => {
    const renderItem = useCallback(
      ({ item, extraData }: IAnchorListRenderItemProps<ChatRow>) => {
        if (item.type === "day") return <ChatDayRow dayKey={item.dayKey} />;

        return (
          <ChatMessageRow
            message={item.message}
            quoted={
              item.message.replyToId
                ? messagesById.get(item.message.replyToId)
                : undefined
            }
            // Подсветка приходит через `extraData`: переработанный контейнер
            // берёт её из пропов, а не из состояния прошлого сообщения.
            isHighlighted={extraData === item.message.id}
            onAction={onAction}
            onQuotePress={onQuotePress}
            onMenuOpen={onMenuOpen}
            onMenuClose={onMenuClose}
          />
        );
      },
      [messagesById, onAction, onQuotePress, onMenuOpen, onMenuClose],
    );

    const sticky = useMemo<IAnchorListStickyConfig<ChatRow>[]>(
      () => [{ edge: "start", indices: dayIndices }],
      [dayIndices],
    );

    const sharedValues = useMemo(
      () => ({ isWithinMaintainScrollAtEndThreshold: isAtEnd }),
      [isAtEnd],
    );

    const maintainScrollAtEnd = useMemo(
      () => ({ onlyWhenAtEnd: true, animated: true }),
      [],
    );

    // История приезжает сверху и не двигает то, что на экране; правка меняет
    // высоту строки — её тоже компенсируем.
    const maintainVisibleContentPosition = useMemo(
      () => ({ data: true, size: true }),
      [],
    );

    return (
      <AnchorList
        ref={ref}
        data={rows}
        renderItem={renderItem}
        keyExtractor={chatRowKey}
        getItemType={chatRowType}
        getFixedItemSize={chatRowFixedSize}
        estimatedItemSize={CHAT_ESTIMATED_ROW_SIZE}
        extraData={highlightedId}
        initialScroll={initialScroll}
        alignItemsAtEnd
        maintainScrollAtEnd={maintainScrollAtEnd}
        maintainVisibleContentPosition={maintainVisibleContentPosition}
        sticky={sticky}
        insetEnd={insetEnd}
        sharedValues={sharedValues}
        onScrollEndDrag={onScrollEndDrag}
        onStartReached={onStartReached}
        recycleItems
        style={ss.list}
      />
    );
  },
);

ChatList.displayName = "ChatList";

const ss = StyleSheet.create({
  list: { flex: 1 },
});
