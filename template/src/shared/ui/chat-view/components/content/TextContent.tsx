import React, { FC, memo, useMemo } from "react";
import { Text, TextStyle } from "react-native";

import { IChatViewLayout, IChatViewTheme } from "../../model";
import { ChatMessageOwnership } from "../../types";
import { useChatViewContext } from "../chat-view-context";

/**
 * Порт TextContentView: текст сообщения с детекцией ссылок и телефонов
 * (NSDataDetector → regex). Тап по ссылке не всплывает к тапу по сообщению.
 */

interface ITextSegment {
  text: string;
  url?: string;
}

const URL_RE = /(?:https?:\/\/|www\.)[^\s<]+/gi;
const PHONE_RE = /\+?\d[\d\-() ]{7,}\d/g;

const detectSegments = (text: string): ITextSegment[] => {
  const matches: { start: number; end: number; url: string }[] = [];

  for (const match of text.matchAll(URL_RE)) {
    const value = match[0];
    const start = match.index ?? 0;

    matches.push({
      start,
      end: start + value.length,
      url: value.startsWith("http") ? value : `https://${value}`,
    });
  }

  for (const match of text.matchAll(PHONE_RE)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;

    if (matches.some(m => start < m.end && end > m.start)) continue;

    matches.push({
      start,
      end,
      url: `tel:${match[0].replace(/[\s\-()]/g, "")}`,
    });
  }

  if (matches.length === 0) return [{ text }];

  matches.sort((a, b) => a.start - b.start);

  const segments: ITextSegment[] = [];
  let cursor = 0;

  for (const m of matches) {
    if (m.start > cursor) {
      segments.push({ text: text.slice(cursor, m.start) });
    }
    segments.push({ text: text.slice(m.start, m.end), url: m.url });
    cursor = m.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return segments;
};

const textColorFor = (
  ownership: ChatMessageOwnership,
  theme: IChatViewTheme,
): string => {
  switch (ownership) {
    case "mine":
      return theme.outgoingText;
    case "theirs":
      return theme.incomingText;
    case "system":
      return theme.systemText;
    case "pinned":
      return theme.pinnedText;
  }
};

const linkColorFor = (
  ownership: ChatMessageOwnership,
  theme: IChatViewTheme,
): string => (ownership === "mine" ? theme.outgoingLink : theme.incomingLink);

interface ITextContentProps {
  messageId: string;
  text: string;
  ownership: ChatMessageOwnership;
}

export const TextContent: FC<ITextContentProps> = memo(
  ({ messageId, text, ownership }) => {
    const { theme, layout, features, delegate } = useChatViewContext();

    const segments = useMemo(
      () => (features.linkDetectionEnabled ? detectSegments(text) : [{ text }]),
      [text, features.linkDetectionEnabled],
    );

    const baseStyle: TextStyle = {
      fontSize: layout.messageFont.fontSize,
      fontWeight: layout.messageFont.fontWeight,
      color: textColorFor(ownership, theme),
      textAlign: ownership === "system" ? "center" : "auto",
    };

    if (segments.length === 1 && !segments[0].url) {
      return <Text style={baseStyle}>{text}</Text>;
    }

    const linkColor = linkColorFor(ownership, theme);

    return (
      <Text style={baseStyle}>
        {segments.map((segment, i) =>
          segment.url ? (
            <Text
              key={i}
              style={linkStyle(linkColor)}
              suppressHighlighting
              onPress={() => {
                const url = segment.url!;

                if (url.startsWith("tel:")) {
                  delegate.current?.onPhoneNumberTap(
                    url.replace("tel:", ""),
                    messageId,
                  );
                } else {
                  delegate.current?.onLinkTap(url, messageId);
                }
              }}
            >
              {segment.text}
            </Text>
          ) : (
            segment.text
          ),
        )}
      </Text>
    );
  },
);

TextContent.displayName = "TextContent";

const linkStyle = (color: string): TextStyle => ({
  color,
  textDecorationLine: "underline",
});

export const chatLinkDetectSegments = detectSegments;
