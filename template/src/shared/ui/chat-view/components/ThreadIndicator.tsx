import React, { FC, memo, useCallback } from "react";
import { Pressable } from "react-native";

import { useChatViewContext } from "../model";
import { ChatThreadInfo } from "../types";
import { threadReplyCountLabel, withOpacity } from "../utils";
import { ChatIcon } from "./ChatIcon";
import { ChatText } from "./ChatText";

/**
 * Индикатор треда: иконка диалога, «N ответов», имя последнего ответившего
 * и шеврон.
 */

interface IThreadIndicatorProps {
  messageId: string;
  thread: ChatThreadInfo;
}

export const ThreadIndicator: FC<IThreadIndicatorProps> = memo(
  ({ messageId, thread }) => {
    const { colors, styles, actions } = useChatViewContext();

    const handlePress = useCallback(
      () => actions.current?.onThreadTap(messageId, thread.threadId),
      [actions, messageId, thread.threadId],
    );

    return (
      <Pressable style={styles.shared.threadRow} onPress={handlePress}>
        <ChatIcon
          name="bubble.left.and.bubble.right"
          size={14}
          color={colors.threadBarIcon}
        />
        <ChatText style={styles.shared.threadText}>
          {threadReplyCountLabel(thread.replyCount)}
        </ChatText>
        {!!thread.lastReplierName && (
          <>
            <ChatText style={styles.shared.threadSeparator}>{"·"}</ChatText>
            <ChatText numberOfLines={1} style={styles.shared.threadReplier}>
              {thread.lastReplierName}
            </ChatText>
          </>
        )}
        <ChatIcon
          name="chevron.right"
          size={10}
          color={withOpacity(colors.threadBarText, 0.4)}
          strokeWidth={3}
        />
      </Pressable>
    );
  },
);

ThreadIndicator.displayName = "ThreadIndicator";
