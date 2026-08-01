import React, { FC, memo } from "react";

import { ChatRow, IParsedChatMessage } from "../model";
import { DateSeparatorRow } from "./DateSeparatorRow";
import { LoadingRow } from "./LoadingRow";
import { MessageCell } from "./MessageCell";
import { IResolvedReply } from "./ReplyPreview";

/**
 * Диспетчер строки — порт `ChatDataSource.cellProvider`.
 *
 * Вынесен из списка отдельным мемо-компонентом: `renderItem` вызывается на
 * каждый видимый элемент при любом обновлении, и всё, что можно не
 * пересчитывать в нём, пересчитываться не должно.
 */

export interface IChatRowViewProps {
  row: ChatRow;
  index: number;
  /** Все строки — нужны для расчёта якоря аватара по соседям. */
  rows: ChatRow[];
  messageIndex: Map<string, IParsedChatMessage>;
  /** Скрыть первый разделитель, пока сверху крутится спиннер. */
  hideFirstSeparator: boolean;
  firstSeparatorIndex: number;
}

/**
 * Цитата в том виде, в каком её покажет ячейка: имя и текст берутся из
 * оригинального сообщения, а не из сырого `ReplyRef`.
 * Порт `resolvedReply(for:)`.
 */
const resolveReply = (
  message: IParsedChatMessage,
  messageIndex: Map<string, IParsedChatMessage>,
): IResolvedReply | undefined => {
  if (!message.reply) return undefined;

  const original = messageIndex.get(message.reply.id);

  if (!original) return undefined;

  return {
    senderName: original.senderName ?? "Неизвестный",
    text: original.body.text ?? "",
    hasImage: original.body.media != null,
  };
};

/**
 * Последнее сообщение в группе одного отправителя — только под ним стоит
 * аватар. Порт `computeAvatarGroups()`: эталон считает группы целиком, но
 * ячейке нужен лишь признак «я последний в своей группе».
 */
const isAvatarAnchor = (
  message: IParsedChatMessage,
  index: number,
  rows: ChatRow[],
): boolean => {
  for (let i = index + 1; i < rows.length; i++) {
    const next = rows[i];

    if (next.type === "dateSeparator") continue;
    if (next.type === "loading") break;

    return !(
      next.message.ownership === "theirs" &&
      message.ownership === "theirs" &&
      next.message.senderName === message.senderName
    );
  }

  return true;
};

export const ChatRowView: FC<IChatRowViewProps> = memo(
  ({
    row,
    index,
    rows,
    messageIndex,
    hideFirstSeparator,
    firstSeparatorIndex,
  }) => {
    switch (row.type) {
      case "message":
        return (
          <MessageCell
            message={row.message}
            resolvedReply={resolveReply(row.message, messageIndex)}
            avatarAnchor={isAvatarAnchor(row.message, index, rows)}
          />
        );

      case "dateSeparator":
        return (
          <DateSeparatorRow
            groupDate={row.groupDate}
            hidden={hideFirstSeparator && index === firstSeparatorIndex}
          />
        );

      case "loading":
        return <LoadingRow />;
    }
  },
);

ChatRowView.displayName = "ChatRowView";
