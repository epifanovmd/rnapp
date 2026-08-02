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
   * (`onStartReachedThreshold` / `onEndReachedThreshold`), поэтому деление на
   * измеренную высоту происходит в `JsChatView`.
   */
  topLoadThreshold: number;
  bottomLoadThreshold: number;
  /** Расстояние от низа в пикселях, ниже которого чат считается «внизу». */
  scrollToBottomThreshold: number;
  autoScrollOnNewMessage: boolean;
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

/** Отбрасывает ключи со значением `undefined`, чтобы они не затирали дефолт. */
const defined = <T extends object>(source: T): Partial<T> => {
  const result: Partial<T> = {};

  for (const key of Object.keys(source) as (keyof T)[]) {
    if (source[key] !== undefined) result[key] = source[key];
  }

  return result;
};

/**
 * Порядок применения повторяет нативную реализацию: сначала индивидуальные
 * пропы, затем объект `features` перекрывает их.
 */
export const resolveChatFeatures = ({
  features,
  emojiReactions,
  showSenderName,
  showFloatingDate,
  topThreshold,
  bottomThreshold,
  scrollToBottomThreshold,
}: IResolveChatFeaturesInput): IChatFeatures => ({
  ...CHAT_DEFAULT_FEATURES,
  ...defined({
    emojiReactions,
    showFloatingDate,
    topLoadThreshold: topThreshold,
    bottomLoadThreshold: bottomThreshold,
    scrollToBottomThreshold,
    senderNameMode:
      showSenderName === undefined
        ? undefined
        : showSenderName
          ? ("incomingOnly" as const)
          : ("never" as const),
  }),
  ...(features ? defined(features) : null),
});
