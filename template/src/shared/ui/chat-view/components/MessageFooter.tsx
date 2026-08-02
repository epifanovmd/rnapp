import React, { FC, memo } from "react";
import { View } from "react-native";

import { IParsedChatMessage } from "../data";
import { ChatMessageStatus } from "../types";
import { getTimeString } from "../utils";
import { useChatViewContext } from "./chat-view-context";
import { ChatIcon, ChatIconName } from "./ChatIcon";
import { ChatText } from "./ChatText";

/**
 * Футер пузыря: «изм.», время и иконка статуса (только исходящие), прижатые
 * к правому краю.
 */

const STATUS_ICONS: Record<ChatMessageStatus, ChatIconName> = {
  sending: "clock",
  sent: "checkmark",
  delivered: "checkmark.circle",
  read: "checkmark.circle.fill",
};

interface IMessageFooterProps {
  message: IParsedChatMessage;
}

export const MessageFooter: FC<IMessageFooterProps> = memo(({ message }) => {
  const { theme, layout, features, styles } = useChatViewContext();

  const s = styles.byOwnership[message.ownership];
  const isOutgoing = message.ownership === "mine";

  return (
    <View style={styles.shared.footerRow}>
      {message.isEdited && features.showEditedMark && (
        <ChatText style={s.edited}>{"изм."}</ChatText>
      )}
      {features.showTimestamp && (
        <ChatText style={s.time}>{getTimeString(message.timestamp)}</ChatText>
      )}
      {isOutgoing && features.showMessageStatus && (
        <ChatIcon
          name={STATUS_ICONS[message.status]}
          size={layout.statusIconSize}
          color={
            message.status === "read"
              ? theme.outgoingStatusRead
              : theme.outgoingStatus
          }
          strokeWidth={2.6}
        />
      )}
    </View>
  );
});

MessageFooter.displayName = "MessageFooter";
