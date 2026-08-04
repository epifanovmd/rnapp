import { ChatFeatures, ChatSenderNameMode } from "../types";

/**
 * Флаги и пороги поведения чата со значениями по умолчанию.
 */
export interface IChatFeatures {
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
  /** Прилипающая плашка даты вверху списка. */
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

  /**
   * Пороги пагинации в пикселях. Список принимает их долей высоты вьюпорта
   * (`onStartReachedThreshold` / `onEndReachedThreshold`).
   */
  topLoadThreshold: number;
  bottomLoadThreshold: number;
  /** Расстояние от низа в пикселях, ниже которого чат считается «внизу». */
  scrollToBottomThreshold: number;
  autoScrollOnNewMessage: boolean;
  /** Анимировать исчезновение удалённого сообщения (только JS-реализация). */
  animateMessageRemoval: boolean;
  /** Рассыпать удаляемое сообщение на частицы. */
  disintegrationEnabled: boolean;
}

export const CHAT_DEFAULT_FEATURES: IChatFeatures = {
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
  animateMessageRemoval: true,
  disintegrationEnabled: false,
};

/** Отбрасывает ключи со значением `undefined`, чтобы они не затирали дефолт. */
const defined = <T extends object>(source: T): Partial<T> => {
  const result: Partial<T> = {};

  for (const key of Object.keys(source) as (keyof T)[]) {
    if (source[key] !== undefined) result[key] = source[key];
  }

  return result;
};

/** Наложение пропа `features` на дефолты. */
export const resolveChatFeatures = (
  features: ChatFeatures | undefined,
): IChatFeatures => ({
  ...CHAT_DEFAULT_FEATURES,
  ...(features ? defined(features) : null),
});
