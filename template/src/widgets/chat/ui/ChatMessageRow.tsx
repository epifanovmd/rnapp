import { IChatMessage, MessageBubble } from "@entities/message";
import { MessageActionId, MessageActionsMenu } from "@features/message-actions";
import React, { FC, memo, useCallback } from "react";
import { StyleSheet, View } from "react-native";

/** Ширина, дальше которой пузырь не растёт. */
const BUBBLE_MAX_WIDTH = "80%";

export interface IChatMessageRowProps {
  message: IChatMessage;
  /** Сообщение, на которое отвечает это. */
  quoted?: IChatMessage;
  /** Подсветка после перехода к сообщению. */
  isHighlighted?: boolean;
  onAction: (action: MessageActionId, message: IChatMessage) => void;
  /** Переход к цитируемому сообщению. */
  onQuotePress: (messageId: string) => void;
  /** Меню открылось: список под ним обязан встать на месте. */
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

/**
 * Строка сообщения: пузырь, его меню действий и переход по цитате.
 *
 * Выравнивание задаёт строка, а не пузырь: меню снимает снимок ровно того
 * узла, который обёрнут, и растянутая на всю ширину обёртка утащила бы в него
 * пустое место рядом с сообщением.
 */
export const ChatMessageRow: FC<IChatMessageRowProps> = memo(
  ({
    message,
    quoted,
    isHighlighted,
    onAction,
    onQuotePress,
    onMenuOpen,
    onMenuClose,
  }) => {
    const handleQuotePress = useCallback(
      () => quoted && onQuotePress(quoted.id),
      [quoted, onQuotePress],
    );

    return (
      <View style={[ss.row, message.isOwn ? ss.own : ss.foreign]}>
        <MessageActionsMenu
          message={message}
          style={ss.menu}
          onAction={onAction}
          onOpen={onMenuOpen}
          onClose={onMenuClose}
        >
          <MessageBubble
            message={message}
            quoted={quoted}
            isHighlighted={isHighlighted}
            onQuotePress={handleQuotePress}
          />
        </MessageActionsMenu>
      </View>
    );
  },
);

ChatMessageRow.displayName = "ChatMessageRow";

const ss = StyleSheet.create({
  foreign: { alignItems: "flex-start" },
  menu: { maxWidth: BUBBLE_MAX_WIDTH },
  own: { alignItems: "flex-end" },
  row: { paddingHorizontal: 12, paddingTop: 4 },
});
