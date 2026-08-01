import React, { FC, memo } from "react";

import { ChatRow } from "../model";
import { DateSeparatorRow } from "./DateSeparatorRow";
import { LoadingRow } from "./LoadingRow";
import { MessageCell } from "./MessageCell";

/**
 * Диспетчер строки — порт `ChatDataSource.cellProvider`.
 *
 * Компонент принимает **только строку**: цитата, признак якоря аватара и
 * скрытие первого разделителя уже посчитаны при её построении
 * (`ChatRowsBuilder`). Благодаря этому `memo` здесь реально работает —
 * строка неизменного сообщения приходит тем же объектом, и вся ветка
 * ячейки не перерисовывается.
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
          avatarAnchor={row.avatarAnchor}
        />
      );

    case "dateSeparator":
      return <DateSeparatorRow groupDate={row.groupDate} hidden={row.hidden} />;

    case "loading":
      return <LoadingRow />;
  }
});

ChatRowView.displayName = "ChatRowView";
