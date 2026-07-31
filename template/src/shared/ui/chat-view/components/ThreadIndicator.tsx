import React, { FC, memo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { threadReplyCountLabel } from "../model";
import { ChatThreadInfo } from "../types";
import { useChatViewContext } from "./chat-view-context";
import { ChatIcon } from "./ChatIcon";

/**
 * Порт threadIndicatorView: иконка диалога, «N ответов», имя последнего
 * ответившего, шеврон.
 */

interface IThreadIndicatorProps {
  messageId: string;
  thread: ChatThreadInfo;
}

export const ThreadIndicator: FC<IThreadIndicatorProps> = memo(
  ({ messageId, thread }) => {
    const { theme, layout, delegate } = useChatViewContext();

    return (
      <Pressable
        style={[
          ss.row,
          { height: layout.threadBarHeight, gap: layout.threadBarSpacing },
        ]}
        onPress={() =>
          delegate.current?.onThreadTap(messageId, thread.threadId)
        }
      >
        <ChatIcon
          name="bubble.left.and.bubble.right"
          size={layout.threadBarIconSize}
          color={theme.threadBarIcon}
        />
        <Text
          style={{
            fontSize: layout.threadBarFont.fontSize,
            fontWeight: layout.threadBarFont.fontWeight,
            color: theme.threadBarText,
          }}
        >
          {threadReplyCountLabel(thread.replyCount)}
        </Text>
        {!!thread.lastReplierName && (
          <>
            <Text
              style={{
                fontSize: layout.threadBarFont.fontSize,
                color: withAlpha(theme.threadBarText, 0.5),
              }}
            >
              {"·"}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                ss.replier,
                {
                  fontSize: layout.threadBarFont.fontSize,
                  fontWeight: layout.threadBarFont.fontWeight,
                  color: withAlpha(theme.threadBarText, 0.7),
                },
              ]}
            >
              {thread.lastReplierName}
            </Text>
          </>
        )}
        <ChatIcon
          name="chevron.right"
          size={layout.threadBarChevronSize}
          color={withAlpha(theme.threadBarText, 0.4)}
          strokeWidth={3}
        />
      </Pressable>
    );
  },
);

ThreadIndicator.displayName = "ThreadIndicator";

const withAlpha = (color: string, opacity: number): string =>
  color.startsWith("rgb(")
    ? color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`)
    : color;

const ss = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  replier: {
    flexShrink: 1,
  },
});
