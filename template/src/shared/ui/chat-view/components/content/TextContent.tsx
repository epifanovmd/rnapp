import React, { FC, memo } from "react";

import { IParsedChatMessage } from "../../data";
import { useChatViewContext } from "../../model";
import { ChatText } from "../ChatText";

/**
 * Текст сообщения. Ссылки и телефоны найдены ещё при
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
    return <ChatText style={s.text}>{text}</ChatText>;
  }

  return (
    <ChatText style={s.text}>
      {textSegments.map((segment, i) => {
        const url = segment.url;

        if (!url) return segment.text;

        return (
          <ChatText
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
          </ChatText>
        );
      })}
    </ChatText>
  );
});

TextContent.displayName = "TextContent";
