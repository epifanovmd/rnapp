import { IChatMessage } from "@entities/message";
import { IAnchorListRef } from "@epifanovmd/anchor-list";
import { MessageActionId } from "@features/message-actions";
import { Col } from "@shared/ui";
import { InputBar, KeyboardInputBar } from "@shared/ui/input-bar";
import React, { FC, useCallback, useMemo, useRef } from "react";
import { useSharedValue } from "react-native-reanimated";

import { buildChatRows, indexMessagesById } from "../model/chat-rows";
import { useChatComposer } from "../model/useChatComposer";
import { useChatListInset } from "../model/useChatListInset";
import { useChatQuoteNavigation } from "../model/useChatQuoteNavigation";
import { useChatScrollRestore } from "../model/useChatScrollRestore";
import { ChatList } from "./ChatList";
import { ChatScrollToEndButton } from "./ChatScrollToEndButton";

export interface IChatViewProps {
  /** Переписка: под её ключом хранится позиция скролла. */
  chatId: string;
  messages: readonly IChatMessage[];
  onSendMessage: (text: string, replyToId?: string) => void;
  onEditMessage: (messageId: string, text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  /** Скролл дошёл до начала истории — место для подгрузки прошлых страниц. */
  onLoadOlder?: () => void;
}

/**
 * Экран переписки: список сообщений, панель ввода и кнопка возврата к концу.
 *
 * О том, откуда берутся сообщения, не знает: данные и их изменения приходят
 * пропами, поэтому тот же виджет годится и моку, и серверу. Всё остальное —
 * строки списка, отступ снизу, состояние панели, переход по цитате и позиция
 * скролла — разложено по хукам `model`, а здесь только собрано вместе.
 */
export const ChatView: FC<IChatViewProps> = ({
  chatId,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onLoadOlder,
}) => {
  const listRef = useRef<IAnchorListRef>(null);

  /** Список у нижнего края: по нему кнопка возврата решает, показываться ли. */
  const isAtEnd = useSharedValue(true);

  const { rows, dayIndices } = useMemo(
    () => buildChatRows(messages),
    [messages],
  );
  const messagesById = useMemo(() => indexMessagesById(messages), [messages]);

  const composer = useChatComposer({ onSendMessage, onEditMessage });
  const inset = useChatListInset({ inputBarRef: composer.inputBarRef });
  const quote = useChatQuoteNavigation({ listRef });
  const scroll = useChatScrollRestore({ chatId, rows, listRef });

  const { reply, edit } = composer;

  const handleAction = useCallback(
    (action: MessageActionId, message: IChatMessage) => {
      switch (action) {
        case "reply":
          reply(message);
          break;
        case "edit":
          edit(message);
          break;
        case "delete":
          onDeleteMessage(message.id);
          break;
      }
    },
    [reply, edit, onDeleteMessage],
  );

  const handleScrollToEnd = useCallback(
    () => listRef.current?.scrollToEnd({ animated: true }),
    [],
  );

  return (
    <Col flex={1}>
      <ChatList
        ref={listRef}
        rows={rows}
        dayIndices={dayIndices}
        messagesById={messagesById}
        insetEnd={inset.insetEnd}
        isAtEnd={isAtEnd}
        initialScroll={scroll.initialScroll}
        highlightedId={quote.highlightedId}
        onAction={handleAction}
        onQuotePress={quote.jumpToMessage}
        onMenuOpen={inset.freeze}
        onMenuClose={inset.restore}
        onScrollEndDrag={scroll.capturePosition}
        onStartReached={onLoadOlder}
      />

      <ChatScrollToEndButton
        bottomInset={inset.liveInset}
        isAtEnd={isAtEnd}
        onPress={handleScrollToEnd}
      />

      <KeyboardInputBar offset={inset.barOffset}>
        <InputBar
          ref={composer.inputBarRef}
          inputAction={composer.inputAction}
          onSendMessage={composer.handleSend}
          onEditMessage={composer.handleEdit}
          onCancelInputAction={composer.cancel}
          onHeightChange={inset.setBarHeight}
        />
      </KeyboardInputBar>
    </Col>
  );
};

ChatView.displayName = "ChatView";
