// NativeChatViewSpec.ts
// Codegen spec for New Architecture (Fabric)

import type { HostComponent, ViewProps } from "react-native";
import type {
  DirectEventHandler,
  Double,
  WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeCommands from "react-native/Libraries/Utilities/codegenNativeCommands";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

// ---- Types ----

export type ImageItem = {
  url: string;
  width?: Double;
  height?: Double;
  thumbnailUrl?: string;
};

export type ReplyReference = {
  id: string;
  text?: string;
  senderName?: string;
  hasImages?: boolean;
};

export type Message = {
  id: string;
  text?: string;
  images?: ImageItem[];
  timestamp: Double;
  senderName?: string;
  isMine?: boolean;
  status?: string;
  replyTo?: ReplyReference;
};

export type Action = {
  id: string;
  title: string;
  systemImage?: string;
  isDestructive?: boolean;
};

// ---- Event Payloads ----

export type ScrollEventData = { x: Double; y: Double };
export type ReachTopEventData = { distanceFromTop: Double };
export type MessagesVisibleEventData = { messageIds: string[] };
export type MessagePressEventData = { messageId: string; message: Message };
export type ActionPressEventData = {
  actionId: string;
  messageId: string;
  message: Message;
};
export type SendMessageEventData = { text: string; replyToId?: string };
export type AttachmentPressEventData = Record<string, never>;
export type ReplyMessagePressEventData = { messageId: string };

// ---- Props ----

export interface NativeChatViewProps extends ViewProps {
  messages: Message[];
  actions?: Action[];
  topThreshold?: WithDefault<Double, 200>;
  isLoading?: WithDefault<boolean, false>;
  replyMessage?: Message | null;

  /**
   * If set, the chat will initially scroll to this message ID (with highlight)
   * instead of scrolling to the bottom. Useful for jump-to-quoted-message flows.
   * Once consumed natively the prop is ignored on subsequent renders.
   */
  initialScrollToMessageId?: string;

  /**
   * Distance from bottom (pts) at which the scroll-to-bottom FAB appears.
   * @default 150
   */
  scrollToBottomThreshold?: WithDefault<Double, 150>;

  onScroll?: DirectEventHandler<ScrollEventData>;
  onReachTop?: DirectEventHandler<ReachTopEventData>;
  onMessagesVisible?: DirectEventHandler<MessagesVisibleEventData>;
  onMessagePress?: DirectEventHandler<MessagePressEventData>;
  onActionPress?: DirectEventHandler<ActionPressEventData>;
  onSendMessage?: DirectEventHandler<SendMessageEventData>;
  onAttachmentPress?: DirectEventHandler<AttachmentPressEventData>;
  onReplyMessagePress?: DirectEventHandler<ReplyMessagePressEventData>;
}

// ---- Commands ----

export interface NativeChatViewCommands {
  scrollToBottom(
    viewRef: React.ElementRef<HostComponent<NativeChatViewProps>>,
  ): void;
  scrollToMessage(
    viewRef: React.ElementRef<HostComponent<NativeChatViewProps>>,
    messageId: string,
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
