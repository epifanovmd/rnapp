import { TextStyle } from "react-native";

import { ChatLayoutConfig } from "../types";

export interface IChatFont {
  fontSize: number;
  fontWeight: TextStyle["fontWeight"];
  /** Табличные цифры — одинаковой ширины, для выровненных чисел. */
  monospacedDigits?: boolean;
}

const font = (
  fontSize: number,
  fontWeight: TextStyle["fontWeight"] = "400",
  monospacedDigits = false,
): IChatFont => ({ fontSize, fontWeight, monospacedDigits });

/**
 * Метрики чата со значениями по умолчанию.
 * Числовые значения переопределяются пропом `layout`.
 */
export interface IChatViewLayout {
  // Пузырь сообщения
  bubbleCornerRadius: number;
  bubbleTailWidth: number;
  bubbleMaxWidthRatio: number;
  bubbleMinWidth: number;
  bubbleHPad: number;
  bubbleVPad: number;
  bubbleBottomPad: number;
  bubbleSpacing: number;
  mixedContentSpacing: number;

  // Ячейка сообщения
  cellHMargin: number;
  cellVSpacing: number;
  cellMinHeight: number;
  systemCellBottomSpacing: number;
  pinnedCellBottomSpacing: number;

  // Аватарки
  avatarSize: number;
  avatarLeadingMargin: number;
  avatarBubbleSpacing: number;

  // Шрифты контента
  messageFont: IChatFont;
  senderNameFont: IChatFont;
  timeFont: IChatFont;
  editedFont: IChatFont;
  forwardedFont: IChatFont;
  forwardedAccentWidth: number;
  forwardedContentInset: number;

  // Футер
  footerHeight: number;
  footerSpacing: number;
  statusIconSize: number;

  // Превью цитаты
  replyHeight: number;
  replyAccentWidth: number;
  replyCornerRadius: number;
  replyFont: IChatFont;
  replySenderFont: IChatFont;

  // Реакции
  reactionChipHeight: number;
  reactionChipSpacing: number;
  reactionChipPadding: number;
  reactionBorderWidth: number;
  reactionFont: IChatFont;

  // Тред
  threadBarHeight: number;
  threadBarFont: IChatFont;
  threadBarSpacing: number;
  threadBarIconSize: number;
  threadBarChevronSize: number;

  // Медиа / изображения
  imageMaxHeight: number;
  imageMinHeight: number;
  imageCornerRadius: number;
  mediaGridSpacing: number;
  mediaPlayIconSize: number;
  mediaOverlayFont: IChatFont;
  mediaDurationFont: IChatFont;
  mediaDurationCornerRadius: number;
  mediaPlayShadowOpacity: number;
  mediaPlayShadowRadius: number;
  mediaDurationPadH: number;
  mediaDurationPadV: number;
  mediaDurationMargin: number;

  // Видео
  videoPlaySize: number;
  videoDurationFont: IChatFont;

  // Голосовое сообщение
  voiceWaveformHeight: number;
  voiceBarWidth: number;
  voiceBarSpacing: number;
  voiceDurationFont: IChatFont;
  voicePlaySize: number;
  voicePlayIconSize: number;
  voiceWaveformWidth: number;
  voiceWaveformTrailingInset: number;
  voiceContentSpacing: number;
  voiceBarMinHeight: number;

  // Опрос
  pollQuestionFont: IChatFont;
  pollSubtitleFont: IChatFont;
  pollOptionFont: IChatFont;
  pollPercentFont: IChatFont;
  pollBarHeight: number;
  pollBarCornerRadius: number;
  pollHeaderSpacing: number;
  pollOptionSpacing: number;
  pollVotesFont: IChatFont;
  pollBarHPad: number;
  pollAnimationDuration: number;

  // Файл
  fileIconSize: number;
  fileIconPointSize: number;
  fileNameFont: IChatFont;
  fileSizeFont: IChatFont;
  fileRowSpacing: number;
  fileContentSpacing: number;
  filePadding: number;
  fileCornerRadius: number;

  // Только эмодзи
  emojiFont1: IChatFont;
  emojiFont2: IChatFont;
  emojiFont3: IChatFont;

  // Разделитель дат
  dateSeparatorFont: IChatFont;
  dateSeparatorVPad: number;
  dateSeparatorHPad: number;
  dateSeparatorCornerRadius: number;

  // Коллекция
  collectionTopPadding: number;
  collectionBottomPadding: number;
  sectionSpacing: number;

  // Панель ввода
  inputBarMinHeight: number;
  inputBarVPad: number;
  inputBarHPad: number;
  textViewMinHeight: number;
  textViewMaxHeight: number;
  textViewCornerRadius: number;
  textViewFont: IChatFont;
  textViewInsetTop: number;
  textViewInsetLeft: number;
  textViewInsetBottom: number;
  textViewInsetRight: number;
  inputReplyPanelHeight: number;
  inputButtonSize: number;
  inputSeparatorHeight: number;
  inputStackSpacing: number;
  inputBorderWidth: number;
  inputIconSize: number;
  inputReplyIconSize: number;
  inputReplyCancelSize: number;
  inputReplyCancelIconSize: number;
  inputReplySpacing: number;
  recordFloatingMicIconSize: number;
  recordLockChevronSize: number;
  recordLockButtonIconSize: number;
  recordLockBottomMargin: number;
  recordLockChevronTopPad: number;
  recordLockIconCenterOffset: number;
  recordDotLeading: number;
  recordTimerLeading: number;
  recordSlideHintOffset: number;
  inputPlaceholderLeading: number;
  inputPlaceholderText: string;
  inputSendButtonInset: number;
  inputSendButtonIconSize: number;
  inputReplyAccentWidth: number;
  inputReplySenderFont: IChatFont;
  inputReplyTextFont: IChatFont;

  // FAB
  fabSize: number;
  fabMargin: number;
  fabTrailingMargin: number;
  fabArrowSize: number;
  fabShadowOpacity: number;
  fabShadowRadius: number;
  fabShadowOffsetY: number;
  fabBadgeCornerRadius: number;
  fabBadgeHeight: number;
  fabBadgeMinWidth: number;
  fabBadgeFont: IChatFont;
  fabBadgePadH: number;

  // Тени пузыря
  bubbleShadowOpacity: number;
  bubbleShadowRadius: number;

  // Запись голоса
  recordDotSize: number;
  recordTimerFont: IChatFont;
  recordCancelFont: IChatFont;
  recordStopSize: number;
  recordDotMinAlpha: number;
  recordFloatingMicSize: number;
  recordCancelThreshold: number;
  recordLockThreshold: number;
  recordLockIconSize: number;
  recordLockContainerSize: number;
  recordTrashIconSize: number;
  recordMinPressDuration: number;
  recordPulseRingSize: number;
  recordPulseBaseScale: number;
  recordPulseMaxScale: number;
  recordPulseDuration: number;

  // Анимации (секунды)
  floatingDateShowDuration: number;
  floatingDateHideDuration: number;
  floatingDateHideDelay: number;
  highlightAnimateIn: number;
  highlightAnimateOut: number;
  highlightDelay: number;
  fabAnimationDuration: number;

  // Жесты
  longPressDuration: number;

  // Пустое состояние
  emptyStateFont: IChatFont;
  emptyStatePadding: number;

  // Скролл
  scrollThrottleInterval: number;
  paginationDebounceInterval: number;

  // Виртуализация
  /**
   * Ожидаемая высота строки — подсказка списку только для первого кадра.
   * Дальше используются реальные измерения, поэтому точность не критична.
   */
  estimatedRowHeight: number;
  /** Насколько за пределы экрана предрендерить строки (px). */
  drawDistance: number;
}

export const CHAT_DEFAULT_LAYOUT: IChatViewLayout = {
  bubbleCornerRadius: 18,
  bubbleTailWidth: 6,
  bubbleMaxWidthRatio: 0.85,
  bubbleMinWidth: 60,
  bubbleHPad: 12,
  bubbleVPad: 6,
  bubbleBottomPad: 5,
  bubbleSpacing: 4,
  mixedContentSpacing: 4,

  cellHMargin: 8,
  cellVSpacing: 2,
  cellMinHeight: 36,
  systemCellBottomSpacing: 20,
  pinnedCellBottomSpacing: 32,

  avatarSize: 36,
  avatarLeadingMargin: 6,
  avatarBubbleSpacing: 2,

  messageFont: font(15),
  senderNameFont: font(13, "600"),
  timeFont: font(11),
  editedFont: font(11),
  forwardedFont: font(13, "500"),
  forwardedAccentWidth: 2.5,
  forwardedContentInset: 8,

  footerHeight: 16,
  footerSpacing: 3,
  statusIconSize: 11,

  replyHeight: 38,
  replyAccentWidth: 2.5,
  replyCornerRadius: 6,
  replyFont: font(13),
  replySenderFont: font(13, "600"),

  reactionChipHeight: 28,
  reactionChipSpacing: 4,
  reactionChipPadding: 8,
  reactionBorderWidth: 1,
  reactionFont: font(13),

  threadBarHeight: 28,
  threadBarFont: font(13, "500"),
  threadBarSpacing: 4,
  threadBarIconSize: 14,
  threadBarChevronSize: 10,

  imageMaxHeight: 280,
  imageMinHeight: 100,
  imageCornerRadius: 12,
  mediaGridSpacing: 2,
  mediaPlayIconSize: 36,
  mediaOverlayFont: font(28, "600"),
  mediaDurationFont: font(12, "500", true),
  mediaDurationCornerRadius: 6,
  mediaPlayShadowOpacity: 0.5,
  mediaPlayShadowRadius: 4,
  mediaDurationPadH: 4,
  mediaDurationPadV: 2,
  mediaDurationMargin: 4,

  videoPlaySize: 48,
  videoDurationFont: font(12, "500", true),

  voiceWaveformHeight: 28,
  voiceBarWidth: 2.5,
  voiceBarSpacing: 2,
  voiceDurationFont: font(12, "500", true),
  voicePlaySize: 36,
  voicePlayIconSize: 18,
  voiceWaveformWidth: 140,
  voiceWaveformTrailingInset: 8,
  voiceContentSpacing: 10,
  voiceBarMinHeight: 2,

  pollQuestionFont: font(15, "600"),
  pollSubtitleFont: font(12),
  pollOptionFont: font(14, "500"),
  pollPercentFont: font(13, "600", true),
  pollBarHeight: 32,
  pollBarCornerRadius: 12,
  pollHeaderSpacing: 10,
  pollOptionSpacing: 4,
  pollVotesFont: font(12),
  pollBarHPad: 12,
  pollAnimationDuration: 0.3,

  fileIconSize: 32,
  fileIconPointSize: 16,
  fileNameFont: font(13, "500"),
  fileSizeFont: font(11),
  fileRowSpacing: 2,
  fileContentSpacing: 6,
  filePadding: 6,
  fileCornerRadius: 8,

  emojiFont1: font(48),
  emojiFont2: font(40),
  emojiFont3: font(34),

  dateSeparatorFont: font(13, "500"),
  dateSeparatorVPad: 4,
  dateSeparatorHPad: 12,
  dateSeparatorCornerRadius: 12,

  collectionTopPadding: 8,
  collectionBottomPadding: 8,
  sectionSpacing: 6,

  inputBarMinHeight: 52,
  inputBarVPad: 8,
  inputBarHPad: 12,
  textViewMinHeight: 40,
  textViewMaxHeight: 120,
  textViewCornerRadius: 20,
  textViewFont: font(16),
  textViewInsetTop: 10,
  textViewInsetLeft: 8,
  textViewInsetBottom: 10,
  textViewInsetRight: 40,
  inputReplyPanelHeight: 48,
  inputButtonSize: 40,
  inputSeparatorHeight: 0.5,
  inputStackSpacing: 6,
  inputBorderWidth: 0.5,
  inputIconSize: 16,
  inputReplyIconSize: 10,
  inputReplyCancelSize: 20,
  inputReplyCancelIconSize: 10,
  inputReplySpacing: 8,
  recordFloatingMicIconSize: 18,
  recordLockChevronSize: 10,
  recordLockButtonIconSize: 14,
  recordLockBottomMargin: 8,
  recordLockChevronTopPad: 6,
  recordLockIconCenterOffset: 5,
  recordDotLeading: 12,
  recordTimerLeading: 8,
  recordSlideHintOffset: 20,
  inputPlaceholderLeading: 13,
  inputPlaceholderText: "Сообщение",
  inputSendButtonInset: 4,
  inputSendButtonIconSize: 14,
  inputReplyAccentWidth: 2.5,
  inputReplySenderFont: font(13, "600"),
  inputReplyTextFont: font(13),

  fabSize: 40,
  fabMargin: 12,
  fabTrailingMargin: 16,
  fabArrowSize: 18,
  fabShadowOpacity: 0.18,
  fabShadowRadius: 8,
  fabShadowOffsetY: 2,
  fabBadgeCornerRadius: 10,
  fabBadgeHeight: 20,
  fabBadgeMinWidth: 20,
  fabBadgeFont: font(12, "600", true),
  fabBadgePadH: 6,

  bubbleShadowOpacity: 0.12,
  bubbleShadowRadius: 8,

  recordDotSize: 10,
  recordTimerFont: font(16, "400", true),
  recordCancelFont: font(14),
  recordStopSize: 36,
  recordDotMinAlpha: 0.2,
  recordFloatingMicSize: 48,
  recordCancelThreshold: 100,
  recordLockThreshold: 70,
  recordLockIconSize: 24,
  recordLockContainerSize: 44,
  recordTrashIconSize: 24,
  recordMinPressDuration: 0.15,
  recordPulseRingSize: 56,
  recordPulseBaseScale: 1.15,
  recordPulseMaxScale: 1.28,
  recordPulseDuration: 0.6,

  floatingDateShowDuration: 0.15,
  floatingDateHideDuration: 0.3,
  floatingDateHideDelay: 0.5,
  highlightAnimateIn: 0.2,
  highlightAnimateOut: 0.6,
  highlightDelay: 0.4,
  fabAnimationDuration: 0.25,

  longPressDuration: 0.35,

  emptyStateFont: font(16),
  emptyStatePadding: 32,

  scrollThrottleInterval: 1 / 30,
  paginationDebounceInterval: 0.5,

  estimatedRowHeight: 72,
  drawDistance: 300,
};

/** Числовые ключи NativeChatLayoutConfig, совпадающие с IChatViewLayout по имени. */
const NUMERIC_KEYS = [
  "bubbleCornerRadius",
  "bubbleTailWidth",
  "bubbleMaxWidthRatio",
  "bubbleMinWidth",
  "bubbleHPad",
  "bubbleVPad",
  "bubbleBottomPad",
  "bubbleSpacing",
  "mixedContentSpacing",
  "cellHMargin",
  "cellVSpacing",
  "cellMinHeight",
  "footerHeight",
  "footerSpacing",
  "statusIconSize",
  "replyHeight",
  "replyAccentWidth",
  "replyCornerRadius",
  "reactionChipHeight",
  "reactionChipSpacing",
  "reactionChipPadding",
  "reactionBorderWidth",
  "imageMaxHeight",
  "imageMinHeight",
  "imageCornerRadius",
  "mediaGridSpacing",
  "mediaPlayIconSize",
  "voiceWaveformHeight",
  "voiceBarWidth",
  "voiceBarSpacing",
  "voicePlaySize",
  "voicePlayIconSize",
  "voiceWaveformWidth",
  "voiceWaveformTrailingInset",
  "voiceContentSpacing",
  "voiceBarMinHeight",
  "pollBarHeight",
  "pollBarCornerRadius",
  "pollHeaderSpacing",
  "pollOptionSpacing",
  "pollBarHPad",
  "pollAnimationDuration",
  "fileIconSize",
  "fileRowSpacing",
  "fileContentSpacing",
  "filePadding",
  "fileCornerRadius",
  "dateSeparatorVPad",
  "dateSeparatorHPad",
  "dateSeparatorCornerRadius",
  "collectionTopPadding",
  "collectionBottomPadding",
  "sectionSpacing",
  "inputBarMinHeight",
  "inputBarVPad",
  "inputBarHPad",
  "textViewMinHeight",
  "textViewMaxHeight",
  "textViewCornerRadius",
  "inputReplyPanelHeight",
  "inputButtonSize",
  "inputSeparatorHeight",
  "inputStackSpacing",
  "inputBorderWidth",
  "inputIconSize",
  "inputSendButtonInset",
  "inputSendButtonIconSize",
  "inputReplyAccentWidth",
  "inputPlaceholderLeading",
  "fabSize",
  "fabMargin",
  "fabTrailingMargin",
  "fabArrowSize",
  "fabShadowOpacity",
  "fabShadowRadius",
  "fabBadgeCornerRadius",
  "fabBadgeHeight",
  "fabBadgeMinWidth",
  "fabBadgePadH",
  "bubbleShadowOpacity",
  "bubbleShadowRadius",
  "floatingDateShowDuration",
  "floatingDateHideDuration",
  "floatingDateHideDelay",
  "highlightAnimateIn",
  "highlightAnimateOut",
  "highlightDelay",
  "fabAnimationDuration",
  "longPressDuration",
  "emptyStatePadding",
  "scrollThrottleInterval",
  "paginationDebounceInterval",
  "estimatedRowHeight",
  "drawDistance",
] as const;

export const resolveChatLayout = (
  config: ChatLayoutConfig | undefined,
): IChatViewLayout => {
  if (!config) return CHAT_DEFAULT_LAYOUT;

  const resolved: IChatViewLayout = { ...CHAT_DEFAULT_LAYOUT };
  const source = config as Record<string, unknown>;
  const target = resolved as unknown as Record<string, unknown>;

  for (const key of NUMERIC_KEYS) {
    const value = source[key];

    if (typeof value === "number") {
      target[key] = value;
    }
  }

  if (typeof config.inputPlaceholderText === "string") {
    resolved.inputPlaceholderText = config.inputPlaceholderText;
  }

  return resolved;
};
