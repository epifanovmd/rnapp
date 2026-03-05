// NativeChatViewSpec.ts
// Codegen spec for React Native New Architecture (Fabric/TurboModule).
// Единственная точка истины для контракта нативного компонента.

import React from "react";
import type { HostComponent, ViewProps } from "react-native";
import type {
  DirectEventHandler,
  Double,
  WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeCommands from "react-native/Libraries/Utilities/codegenNativeCommands";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type NativeChatImageItem = {
  url: string;
  width?: Double;
  height?: Double;
  thumbnailUrl?: string;
};

export type NativeChatReplyRef = {
  id: string;
  text?: string;
  senderName?: string;
  hasImages?: boolean;
};

export type NativeChatMessage = {
  id: string;
  text?: string;
  /** Одно изображение (упрощено от массива) */
  images?: NativeChatImageItem[];
  /** Unix timestamp in milliseconds */
  timestamp: Double;
  senderName?: string;
  isMine?: boolean;
  /** "sending" | "sent" | "delivered" | "read" */
  status?: string;
  replyTo?: NativeChatReplyRef;
  isEdited?: boolean;
};

export type NativeChatAction = {
  id: string;
  title: string;
  systemImage?: string;
  isDestructive?: boolean;
};

export type NativeChatEditRef = {
  /** ID редактируемого сообщения — вернётся в onEditMessage */
  id: string;
  /** Текущий текст сообщения — предзаполняется в поле ввода */
  text: string;
};

// ─── Event payloads ───────────────────────────────────────────────────────────

export type NativeChatScrollEventData = { x: Double; y: Double };
export type NativeChatReachTopEventData = { distanceFromTop: Double };
export type NativeChatMessagesVisibleEventData = { messageIds: string[] };
export type NativeChatMessagePressEventData = { messageId: string };
export type NativeChatActionPressEventData = {
  actionId: string;
  messageId: string;
};
export type NativeChatSendMessageEventData = {
  text: string;
  replyToId?: string;
};
export type NativeChatEditMessageEventData = {
  text: string;
  messageId: string;
};
export type NativeChatCancelReplyEventData = {};
export type NativeChatCancelEditEventData = {};
export type NativeChatAttachmentPressEventData = {};
export type NativeChatReplyMessagePressEventData = { messageId: string };

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NativeChatViewProps extends ViewProps {
  messages: NativeChatMessage[];
  actions?: NativeChatAction[];
  topThreshold?: WithDefault<Double, 200>;
  isLoading?: WithDefault<boolean, false>;
  replyMessage?: NativeChatMessage | null;
  editMessage?: NativeChatEditRef | null;
  initialScrollId?: string;
  scrollToBottomThreshold?: WithDefault<Double, 150>;
  /** Тема оформления: "light" (по умолчанию) или "dark" */
  theme?: WithDefault<string, "light">;

  onScroll?: DirectEventHandler<NativeChatScrollEventData>;
  onReachTop?: DirectEventHandler<NativeChatReachTopEventData>;
  onMessagesVisible?: DirectEventHandler<NativeChatMessagesVisibleEventData>;
  onMessagePress?: DirectEventHandler<NativeChatMessagePressEventData>;
  onActionPress?: DirectEventHandler<NativeChatActionPressEventData>;
  onSendMessage?: DirectEventHandler<NativeChatSendMessageEventData>;
  onEditMessage?: DirectEventHandler<NativeChatEditMessageEventData>;
  onCancelReply?: DirectEventHandler<NativeChatCancelReplyEventData>;
  onCancelEdit?: DirectEventHandler<NativeChatCancelEditEventData>;
  onAttachmentPress?: DirectEventHandler<NativeChatAttachmentPressEventData>;
  onReplyMessagePress?: DirectEventHandler<NativeChatReplyMessagePressEventData>;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

export interface NativeChatViewCommands {
  scrollToBottom(
    viewRef: React.ComponentRef<HostComponent<NativeChatViewProps>>,
  ): void;
  scrollToMessage(
    viewRef: React.ComponentRef<HostComponent<NativeChatViewProps>>,
    messageId: string,
    /** "top" | "center" | "bottom" */
    position: string,
    animated: boolean,
    highlight: boolean,
  ): void;
}

export const Commands = codegenNativeCommands<NativeChatViewCommands>({
  supportedCommands: ["scrollToBottom", "scrollToMessage"],
});

export default codegenNativeComponent<NativeChatViewProps>(
  "RNChatView",
) as HostComponent<NativeChatViewProps>;
