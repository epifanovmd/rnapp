// NativeChatViewSpec.ts
// Native ChatView specification with codegen types.

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

export type NativeChatVideoItem = {
  url: string;
  thumbnailUrl?: string;
  width?: Double;
  height?: Double;
  duration?: Double;
};

export type NativeChatPollOption = {
  id: string;
  text: string;
  votes: Double;
  percentage: Double;
};

export type NativeChatPoll = {
  id: string;
  question: string;
  options: NativeChatPollOption[];
  totalVotes: Double;
  selectedOptionIds?: string[];
  isMultipleChoice?: boolean;
  isClosed?: boolean;
};

export type NativeChatVoiceItem = {
  url: string;
  duration: Double;
  waveform?: Double[];
};

export type NativeChatFileItem = {
  url: string;
  name: string;
  size: Double;
  mimeType?: string;
};

export type NativeChatReaction = {
  emoji: string;
  count: Double;
  isMine?: boolean;
};

export type NativeChatReplyRef = {
  id: string;
  text?: string;
  senderName?: string;
  hasImages?: boolean;
};

export type NativeChatAction = {
  id: string;
  title: string;
  systemImage?: string;
  isDestructive?: boolean;
};

export type NativeChatMessage = {
  id: string;
  text?: string;
  images?: NativeChatImageItem[];
  video?: NativeChatVideoItem;
  voice?: NativeChatVoiceItem;
  poll?: NativeChatPoll;
  file?: NativeChatFileItem;
  reactions?: NativeChatReaction[];
  timestamp: Double;
  senderName?: string;
  isMine?: boolean;
  status?: string;
  replyTo?: NativeChatReplyRef;
  forwardedFrom?: string;
  isEdited?: boolean;
  actions?: NativeChatAction[];
};

export type NativeChatInputAction = {
  type: string;
  messageId?: string;
};

// ─── Event payloads ───────────────────────────────────────────────────────────

export type NativeChatScrollEventData = { x: Double; y: Double };
export type NativeChatReachTopEventData = { distanceFromTop: Double };
export type NativeChatReachBottomEventData = { distanceFromBottom: Double };
export type NativeChatMessagesVisibleEventData = { messageIds: string[] };
export type NativeChatMessagePressEventData = { messageId: string };
export type NativeChatActionPressEventData = {
  actionId: string;
  messageId: string;
};
export type NativeChatEmojiReactionSelectData = {
  emoji: string;
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
export type NativeChatCancelInputActionEventData = { type: string };
export type NativeChatAttachmentPressEventData = {};
export type NativeChatReplyMessagePressEventData = { messageId: string };
export type NativeChatVideoPressEventData = {
  messageId: string;
  videoUrl: string;
};
export type NativeChatPollOptionPressEventData = {
  messageId: string;
  pollId: string;
  optionId: string;
};
export type NativeChatPollDetailPressEventData = {
  messageId: string;
  pollId: string;
};

export type NativeChatFilePressEventData = {
  messageId: string;
  fileUrl: string;
  fileName: string;
};

export type NativeChatVoiceRecordingCompleteEventData = {
  fileUrl: string;
  duration: Double;
};

export type NativeChatInputTypingEventData = {
  text: string;
};

export type NativeChatReactionTapEventData = {
  emoji: string;
  messageId: string;
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NativeChatViewProps extends ViewProps {
  messages: NativeChatMessage[];

  /** Список эмодзи для панели контекстного меню. Пример: ["❤️", "👍", "😂"] */
  emojiReactions?: string[];

  /** Есть ли более старые сообщения для подгрузки сверху. */
  hasMore?: WithDefault<boolean, false>;
  /** Есть ли более новые сообщения для подгрузки снизу (detached mode). */
  hasNewer?: WithDefault<boolean, false>;

  topThreshold?: WithDefault<Double, 200>;
  bottomThreshold?: WithDefault<Double, 200>;
  isLoading?: WithDefault<boolean, false>;
  isLoadingTop?: WithDefault<boolean, false>;
  isLoadingBottom?: WithDefault<boolean, false>;
  inputAction?: NativeChatInputAction | null;
  initialScrollId?: string;
  scrollToBottomThreshold?: WithDefault<Double, 150>;
  theme?: WithDefault<string, "light">;
  collectionInsetTop?: WithDefault<Double, 0>;
  collectionInsetBottom?: WithDefault<Double, 0>;
  inputTypingThrottle?: WithDefault<Double, 500>;
  showSenderName?: WithDefault<boolean, false>;

  onScroll?: DirectEventHandler<NativeChatScrollEventData>;
  onReachTop?: DirectEventHandler<NativeChatReachTopEventData>;
  onReachBottom?: DirectEventHandler<NativeChatReachBottomEventData>;
  onMessagesVisible?: DirectEventHandler<NativeChatMessagesVisibleEventData>;
  onMessagePress?: DirectEventHandler<NativeChatMessagePressEventData>;
  onActionPress?: DirectEventHandler<NativeChatActionPressEventData>;
  onEmojiReactionSelect?: DirectEventHandler<NativeChatEmojiReactionSelectData>;
  onSendMessage?: DirectEventHandler<NativeChatSendMessageEventData>;
  onEditMessage?: DirectEventHandler<NativeChatEditMessageEventData>;
  onCancelInputAction?: DirectEventHandler<NativeChatCancelInputActionEventData>;
  onAttachmentPress?: DirectEventHandler<NativeChatAttachmentPressEventData>;
  onReplyMessagePress?: DirectEventHandler<NativeChatReplyMessagePressEventData>;
  onVideoPress?: DirectEventHandler<NativeChatVideoPressEventData>;
  onPollOptionPress?: DirectEventHandler<NativeChatPollOptionPressEventData>;
  onPollDetailPress?: DirectEventHandler<NativeChatPollDetailPressEventData>;
  onFilePress?: DirectEventHandler<NativeChatFilePressEventData>;
  onVoiceRecordingComplete?: DirectEventHandler<NativeChatVoiceRecordingCompleteEventData>;
  onInputTyping?: DirectEventHandler<NativeChatInputTypingEventData>;
  onReactionTap?: DirectEventHandler<NativeChatReactionTapEventData>;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

export interface NativeChatViewCommands {
  scrollToBottom(
    viewRef: React.ComponentRef<HostComponent<NativeChatViewProps>>,
  ): void;
  scrollToMessage(
    viewRef: React.ComponentRef<HostComponent<NativeChatViewProps>>,
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
