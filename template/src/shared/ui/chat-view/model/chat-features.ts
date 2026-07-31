import { ChatFeatures, ChatSenderNameMode } from "../types";

/**
 * Полный порт ChatFeatures из IOSChatView — значения по умолчанию 1:1.
 */
export interface IChatViewFeatures {
  senderNameMode: ChatSenderNameMode;
  showMessageStatus: boolean;
  showTimestamp: boolean;
  showEditedMark: boolean;
  showReactions: boolean;
  showReplyPreview: boolean;
  showForwardedMark: boolean;
  showThreadIndicator: boolean;
  showAvatars: boolean;
  linkDetectionEnabled: boolean;

  showFab: boolean;
  showFloatingDate: boolean;
  showDateSeparators: boolean;
  showTopLoadingIndicator: boolean;
  showBottomLoadingIndicator: boolean;
  showEmptyState: boolean;

  showInputBar: boolean;
  showAttachButton: boolean;
  showVoiceRecording: boolean;

  contextMenuEnabled: boolean;
  emojiReactions: string[];

  topLoadThreshold: number;
  bottomLoadThreshold: number;
  scrollToBottomThreshold: number;
  autoScrollOnNewMessage: boolean;

  disintegrationEnabled: boolean;
}

export const CHAT_DEFAULT_FEATURES: IChatViewFeatures = {
  senderNameMode: "incomingOnly",
  showMessageStatus: true,
  showTimestamp: true,
  showEditedMark: true,
  showReactions: true,
  showReplyPreview: true,
  showForwardedMark: true,
  showThreadIndicator: true,
  showAvatars: false,
  linkDetectionEnabled: true,

  showFab: true,
  showFloatingDate: true,
  showDateSeparators: true,
  showTopLoadingIndicator: true,
  showBottomLoadingIndicator: true,
  showEmptyState: true,

  showInputBar: true,
  showAttachButton: true,
  showVoiceRecording: true,

  contextMenuEnabled: true,
  emojiReactions: [],

  topLoadThreshold: 200,
  bottomLoadThreshold: 200,
  scrollToBottomThreshold: 150,
  autoScrollOnNewMessage: true,

  disintegrationEnabled: false,
};

export interface IResolveChatFeaturesInput {
  features?: ChatFeatures;
  emojiReactions?: string[];
  showSenderName?: boolean;
  showFloatingDate?: boolean;
  topThreshold?: number;
  bottomThreshold?: number;
  scrollToBottomThreshold?: number;
}

/**
 * Порядок применения повторяет RNChatView: сначала индивидуальные пропсы
 * (showSenderName/showFloatingDate/пороги/emojiReactions), затем объект
 * `features` перекрывает их (native применяет features последним).
 */
export const resolveChatFeatures = (
  input: IResolveChatFeaturesInput,
): IChatViewFeatures => {
  const resolved: IChatViewFeatures = { ...CHAT_DEFAULT_FEATURES };

  if (input.showSenderName !== undefined) {
    resolved.senderNameMode = input.showSenderName ? "incomingOnly" : "never";
  }
  if (input.showFloatingDate !== undefined) {
    resolved.showFloatingDate = input.showFloatingDate;
  }
  if (input.topThreshold !== undefined) {
    resolved.topLoadThreshold = input.topThreshold;
  }
  if (input.bottomThreshold !== undefined) {
    resolved.bottomLoadThreshold = input.bottomThreshold;
  }
  if (input.scrollToBottomThreshold !== undefined) {
    resolved.scrollToBottomThreshold = input.scrollToBottomThreshold;
  }
  if (input.emojiReactions !== undefined) {
    resolved.emojiReactions = input.emojiReactions;
  }

  const f = input.features;

  if (f) {
    const target = resolved as unknown as Record<string, unknown>;
    const source = f as Record<string, unknown>;

    for (const key of Object.keys(f)) {
      if (source[key] !== undefined) {
        target[key] = source[key];
      }
    }
  }

  return resolved;
};
