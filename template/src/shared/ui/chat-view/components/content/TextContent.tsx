import React, { FC, memo } from "react";
import { Text } from "react-native";

import { IParsedChatMessage } from "../../data";
import { useChatViewContext } from "../chat-view-context";

/**
 * Текст сообщения — порт `TextContentView`. Ссылки и телефоны найдены ещё при
 * разборе сообщения, здесь остаётся раскрасить сегменты; тап по ссылке не
 * всплывает к тапу по пузырю.
 */

interface ITextContentProps {
  message: IParsedChatMessage;
}

export const TextContent: FC<ITextContentProps> = memo(({ message }) => {
  const { features, styles, delegate } = useChatViewContext();

  const s = styles.byOwnership[message.ownership];
  const { text, textSegments } = message.body;

  if (!features.linkDetectionEnabled || !textSegments) {
    return <Text style={s.text}>{text}</Text>;
  }

  return (
    <Text style={s.text}>
      {textSegments.map((segment, i) => {
        const url = segment.url;

        if (!url) return segment.text;

        return (
          <Text
            key={i}
            suppressHighlighting
            style={s.link}
            onPress={() =>
              url.startsWith("tel:")
                ? delegate.current?.onPhoneNumberTap(url.slice(4), message.id)
                : delegate.current?.onLinkTap(url, message.id)
            }
          >
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
});

TextContent.displayName = "TextContent";
