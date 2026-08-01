import React, { FC, memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  chatTextBase,
  getTimeString,
  IChatViewTheme,
  IParsedChatMessage,
} from "../model";
import { useChatViewContext } from "./chat-view-context";
import { ChatIcon, ChatIconName } from "./ChatIcon";

/**
 * Порт footerView + MessageStatusView: «изм.», время, иконка статуса
 * (только исходящие), выравнивание по правому краю.
 */

const timeColorFor = (
  msg: IParsedChatMessage,
  theme: IChatViewTheme,
): string => {
  switch (msg.ownership) {
    case "mine":
      return theme.outgoingTime;
    case "theirs":
      return theme.incomingTime;
    case "system":
      return theme.systemTime;
    case "pinned":
      return theme.pinnedTime;
  }
};

const editedColorFor = (
  msg: IParsedChatMessage,
  theme: IChatViewTheme,
): string => {
  switch (msg.ownership) {
    case "mine":
      return theme.outgoingEdited;
    case "theirs":
      return theme.incomingEdited;
    case "system":
      return theme.systemTime;
    case "pinned":
      return theme.pinnedTime;
  }
};

const STATUS_ICONS: Record<string, ChatIconName> = {
  sending: "clock",
  sent: "checkmark",
  delivered: "checkmark.circle",
  read: "checkmark.circle.fill",
};

interface IMessageFooterProps {
  message: IParsedChatMessage;
}

export const MessageFooter: FC<IMessageFooterProps> = memo(({ message }) => {
  const { theme, layout, features } = useChatViewContext();
  const isOutgoing = message.ownership === "mine";

  const showEdited = message.isEdited && features.showEditedMark;
  const showStatus = isOutgoing && features.showMessageStatus;

  return (
    <View
      style={[
        ss.row,
        { height: layout.footerHeight, gap: layout.footerSpacing },
      ]}
    >
      {showEdited && (
        <Text
          style={[
            chatTextBase,
            {
              fontSize: layout.editedFont.fontSize,
              fontWeight: layout.editedFont.fontWeight,
              color: editedColorFor(message, theme),
            },
          ]}
        >
          {"изм."}
        </Text>
      )}
      {features.showTimestamp && (
        <Text
          style={[
            chatTextBase,
            {
              fontSize: layout.timeFont.fontSize,
              fontWeight: layout.timeFont.fontWeight,
              color: timeColorFor(message, theme),
            },
          ]}
        >
          {getTimeString(message.timestamp)}
        </Text>
      )}
      {showStatus && (
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

const ss = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
  },
});
