import React, { FC, memo } from "react";

import { ChatRow } from "../data";
import { ChatRowCollapse } from "./ChatRowCollapse";
import { DateSeparatorRow } from "./DateSeparatorRow";
import { LoadingRow } from "./LoadingRow";
import { MessageCell } from "./message-cell";

/**
 * Диспетчер строки.
 *
 * Принимает **только строку и её индекс**: цитата, показ имени и режим крупных
 * эмодзи уже посчитаны в `ChatRowsBuilder`. Поэтому `memo` здесь реально
 * работает — строка неизменного сообщения приходит тем же объектом.
 */
export interface IChatRowViewProps {
  row: ChatRow;
  /** Нужен разделителю дат, чтобы понять, прилип ли он сейчас к кромке. */
  index: number;
}

export const ChatRowView: FC<IChatRowViewProps> = memo(({ row, index }) => {
  switch (row.type) {
    case "message":
      return (
        <ChatRowCollapse rowKey={row.key} removing={row.removing}>
          <MessageCell
            message={row.message}
            resolvedReply={row.resolvedReply}
            showSenderName={row.showSenderName}
            showAvatar={row.showAvatar}
            bubbleless={row.bubbleless}
          />
        </ChatRowCollapse>
      );

    case "dateSeparator":
      return (
        <ChatRowCollapse rowKey={row.key} removing={row.removing}>
          <DateSeparatorRow
            groupDate={row.groupDate}
            hidden={row.hidden}
            index={index}
          />
        </ChatRowCollapse>
      );

    case "loading":
      return <LoadingRow />;
  }
});

ChatRowView.displayName = "ChatRowView";
