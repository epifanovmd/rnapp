import React, { FC, memo } from "react";

import { ChatRow } from "../data";
import { DateSeparatorRow } from "./DateSeparatorRow";
import { LoadingRow } from "./LoadingRow";
import { MessageCell } from "./message-cell";

/**
 * Диспетчер строки.
 *
 * Принимает **только строку**: цитата, показ имени и режим крупных эмодзи уже
 * посчитаны в `ChatRowsBuilder`. Поэтому `memo` здесь реально работает — строка
 * неизменного сообщения приходит тем же объектом.
 */

export interface IChatRowViewProps {
  row: ChatRow;
}

export const ChatRowView: FC<IChatRowViewProps> = memo(({ row }) => {
  switch (row.type) {
    case "message":
      return (
        <MessageCell
          message={row.message}
          resolvedReply={row.resolvedReply}
          showSenderName={row.showSenderName}
          bubbleless={row.bubbleless}
        />
      );

    case "dateSeparator":
      return <DateSeparatorRow groupDate={row.groupDate} hidden={row.hidden} />;

    case "loading":
      return <LoadingRow />;
  }
});

ChatRowView.displayName = "ChatRowView";
