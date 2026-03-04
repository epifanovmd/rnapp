// NativeChatViewSpec.ts
// Codegen spec for React Native New Architecture (Fabric/TurboModule)
// This file is the single source of truth for the native component contract.

import type { HostComponent, ViewProps } from "react-native";
import type {
  DirectEventHandler,
  Double,
  WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeCommands from "react-native/Libraries/Utilities/codegenNativeCommands";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

// ─── Shared domain types ──────────────────────────────────────────────────────

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
  images?: NativeChatImageItem[];
  /** Unix timestamp in milliseconds */
  timestamp: Double;
  senderName?: string;
  isMine?: boolean;
  /** "sending" | "sent" | "delivered" | "read" */
  status?: string;
  replyTo?: NativeChatReplyRef;
};

export type NativeChatAction = {
  id: string;
  title: string;
  /** SF Symbol name, e.g. "trash", "heart.fill" */
  systemImage?: string;
  isDestructive?: boolean;
};

// ─── Event payloads ───────────────────────────────────────────────────────────
// FIX: Все поля в событиях должны быть примитивами (string, number, boolean)
// или массивами/объектами этих примитивов

export type NativeScrollEventData = { x: Double; y: Double };
export type NativeReachTopEventData = { distanceFromTop: Double };
export type NativeMessagesVisibleEventData = { messageIds: string[] };

// FIX: Упрощаем - передаем только ID вместо всего объекта
export type NativeMessagePressEventData = {
  messageId: string;
};

// FIX: Упрощаем - передаем только ID вместо всего объекта
export type NativeActionPressEventData = {
  actionId: string;
  messageId: string;
};

// FIX: Это нормально - только примитивы
export type NativeSendMessageEventData = { text: string; replyToId?: string };
export type NativeAttachmentPressEventData = Record<string, never>;
export type NativeReplyMessagePressEventData = { messageId: string };

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NativeChatViewProps extends ViewProps {
  messages: NativeChatMessage[];
  actions?: NativeChatAction[];

  /** Distance from top (pts) that triggers onReachTop. @default 200 */
  topThreshold?: WithDefault<Double, 200>;

  isLoading?: WithDefault<boolean, false>;

  /** Message to show in the reply preview panel above the input bar. */
  replyMessage?: NativeChatMessage | null;

  /**
   * When set, the chat scrolls to this message ID on first render (with highlight)
   * instead of scrolling to the bottom. Consumed once; ignored on re-renders.
   */
  initialScrollId?: string;

  /** Distance from bottom (pts) at which the scroll-to-bottom FAB appears. @default 150 */
  scrollToBottomThreshold?: WithDefault<Double, 150>;

  onScroll?: DirectEventHandler<NativeScrollEventData>;
  onReachTop?: DirectEventHandler<NativeReachTopEventData>;
  onMessagesVisible?: DirectEventHandler<NativeMessagesVisibleEventData>;
  onMessagePress?: DirectEventHandler<NativeMessagePressEventData>;
  onActionPress?: DirectEventHandler<NativeActionPressEventData>;
  onSendMessage?: DirectEventHandler<NativeSendMessageEventData>;
  onAttachmentPress?: DirectEventHandler<NativeAttachmentPressEventData>;
  onReplyMessagePress?: DirectEventHandler<NativeReplyMessagePressEventData>;
}

// ─── Imperative commands ──────────────────────────────────────────────────────

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
