import { getTextStyle } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { IChatMessage } from "../model/message.types";
import { formatMessageTime } from "../model/message-format";
import { MessageContentView, messagePreview } from "./MessageContentView";
import { MessageQuote } from "./MessageQuote";
import { useMessageColors } from "./useMessageColors";

export interface IMessageBubbleProps {
  message: IChatMessage;
  /** Сообщение, на которое отвечает это; нет — цитата не рисуется. */
  quoted?: IChatMessage;
  /** Подсветка после перехода к сообщению. */
  isHighlighted?: boolean;
  /** Переход к цитируемому сообщению. */
  onQuotePress?: () => void;
}

/**
 * Пузырь сообщения: цитата, содержимое, время и отметка о правке.
 *
 * Разметка на примитивах и статических стилях: пузырь живёт в горячем пути
 * списка — его пересобирают на каждой переработке контейнера, и лишний объект
 * стиля здесь оборачивается новым замером всей строки.
 */
export const MessageBubble: FC<IMessageBubbleProps> = memo(
  ({ message, quoted, isHighlighted, onQuotePress }) => {
    const colors = useMessageColors(message.isOwn);

    return (
      <View
        style={[
          ss.bubble,
          message.isOwn ? ss.own : ss.foreign,
          { backgroundColor: colors.bubble },
        ]}
      >
        {/* Подсветка — слоем поверх фона: рамка меняла бы высоту строки, а по
            ней список считает раскладку. */}
        {isHighlighted && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.accent },
              ss.highlight,
            ]}
          />
        )}

        {!message.isOwn && (
          <Text style={[getTextStyle("Caption_M1"), { color: colors.accent }]}>
            {message.authorName}
          </Text>
        )}

        {quoted && (
          <MessageQuote
            authorName={quoted.authorName}
            text={messagePreview(quoted)}
            accentColor={colors.accent}
            backgroundColor={colors.quote}
            textColor={colors.secondary}
            onPress={onQuotePress}
          />
        )}

        <MessageContentView content={message.content} colors={colors} />

        <View style={ss.footer}>
          {message.isEdited && (
            <Text
              style={[getTextStyle("Caption_M3"), { color: colors.secondary }]}
            >
              {"изменено"}
            </Text>
          )}
          <Text
            style={[getTextStyle("Caption_M3"), { color: colors.secondary }]}
          >
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>
      </View>
    );
  },
);

MessageBubble.displayName = "MessageBubble";

const ss = StyleSheet.create({
  bubble: {
    borderRadius: 16,
    gap: 4,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  footer: {
    alignItems: "center",
    alignSelf: "flex-end",
    flexDirection: "row",
    gap: 4,
  },
  foreign: { alignSelf: "flex-start" },
  highlight: { opacity: 0.25 },
  own: { alignSelf: "flex-end" },
});
