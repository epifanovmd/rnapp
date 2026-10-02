import { Container } from "@shared/ui";
import { ChatView } from "@widgets/chat";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import { useChatMessages } from "./model/useChatMessages";

/** Переписка демо-экрана: под этим ключом хранится позиция скролла. */
const CHAT_ID = "demo";

/**
 * Экран переписки.
 *
 * Тонкая композиция: данные берёт у `useChatMessages`, показ и поведение — у
 * `ChatView`. Safe area снизу входит в отступ панели ввода, сверху её съел
 * хедер, поэтому экрану добирать нечего.
 */
export const Chat: FC = observer(() => {
  const { messages, sendMessage, editMessage, deleteMessage } =
    useChatMessages();

  return (
    <Container edges={[]}>
      <ChatView
        chatId={CHAT_ID}
        messages={messages}
        onSendMessage={sendMessage}
        onEditMessage={editMessage}
        onDeleteMessage={deleteMessage}
      />
    </Container>
  );
});

Chat.displayName = "Chat";
