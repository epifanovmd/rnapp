import React, { forwardRef } from "react";
import { Platform } from "react-native";

import { JsChatView } from "./JsChatView";
import { NativeChatView } from "./native";
import { ChatViewProps, IChatViewRef } from "./types";

/**
 * Единственная публичная точка входа ChatView: iOS — нативный RNChatView
 * (IOSChatView pod), остальные платформы — реализация на FlashList.
 */
export const ChatView = forwardRef<IChatViewRef, ChatViewProps>((props, ref) =>
  Platform.OS === "ios" ? (
    <NativeChatView ref={ref} {...props} />
  ) : (
    <JsChatView ref={ref} {...props} />
  ),
);

ChatView.displayName = "ChatView";

/** Императивный интерфейс — тот же тип для ref у обеих реализаций. */
export type ChatView = IChatViewRef;
