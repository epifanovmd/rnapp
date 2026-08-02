import { TextStyle } from "react-native";

/**
 * Метрики чата.
 *
 * Здесь только то, что рисует сам чат. Метрики панели ввода и записи голоса
 * живут в `shared/ui/input-bar` (`IInputBarLayout`) — чат их не описывает,
 * а лишь прокидывает (см. `resolveChatLayout`).
 */

export interface IChatFont {
  fontSize: number;
  fontWeight: TextStyle["fontWeight"];
  /** Табличные цифры — одинаковой ширины, для выровненных чисел. */
  monospacedDigits?: boolean;
}

export const font = (
  fontSize: number,
  fontWeight: TextStyle["fontWeight"] = "400",
  monospacedDigits = false,
): IChatFont => ({ fontSize, fontWeight, monospacedDigits });

export interface IChatLayout {
  // Пузырь
  bubbleCornerRadius: number;
  bubbleMaxWidthRatio: number;
  bubbleMinWidth: number;
  bubbleHPad: number;
  bubbleVPad: number;
  bubbleBottomPad: number;
  bubbleSpacing: number;
  mixedContentSpacing: number;

  // Ячейка
  cellHMargin: number;
  cellVSpacing: number;
  cellMinHeight: number;
  systemCellBottomSpacing: number;
  pinnedCellBottomSpacing: number;

  // Аватар
  avatarSize: number;
  avatarLeadingMargin: number;
  avatarBubbleSpacing: number;

  // Текст
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

  // Цитата
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

  // Медиа
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

  // Голосовое
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
  pollVotesFont: IChatFont;
  pollBarHeight: number;
  pollBarCornerRadius: number;
  pollBarHPad: number;
  pollHeaderSpacing: number;
  pollOptionSpacing: number;

  // Файл
  fileIconSize: number;
  fileIconPointSize: number;
  fileNameFont: IChatFont;
  fileSizeFont: IChatFont;
  fileRowSpacing: number;
  fileContentSpacing: number;
  filePadding: number;
  fileCornerRadius: number;

  /** Кегли для сообщений из 1, 2 и 3 эмодзи. */
  emojiFonts: readonly [IChatFont, IChatFont, IChatFont];

  // Разделитель дат (он же — прилипающая плашка даты)
  dateSeparatorFont: IChatFont;
  dateSeparatorVPad: number;
  dateSeparatorHPad: number;
  dateSeparatorCornerRadius: number;

  // Список
  collectionTopPadding: number;
  collectionBottomPadding: number;
  sectionSpacing: number;

  // FAB
  fabMargin: number;
  fabArrowSize: number;
  fabShadowOpacity: number;
  fabShadowRadius: number;
  fabShadowOffsetY: number;
  fabBadgeCornerRadius: number;
  fabBadgeHeight: number;
  fabBadgeMinWidth: number;
  fabBadgeFont: IChatFont;
  fabBadgePadH: number;

  // Пустое состояние
  emptyStateFont: IChatFont;
  emptyStatePadding: number;

  // Анимации (секунды)
  stickyDateShowDuration: number;
  stickyDateHideDuration: number;
  stickyDateHideDelay: number;
  highlightAnimateIn: number;
  highlightAnimateOut: number;
  highlightDelay: number;
  fabAnimationDuration: number;

  /** Долгое нажатие для контекстного меню (сек). */
  longPressDuration: number;

  /** Троттлинг проброса `onScroll` наружу (сек). */
  scrollThrottleInterval: number;

  // Виртуализация
  /** Подсказка списку для первого кадра; дальше идут реальные измерения. */
  estimatedRowHeight: number;
  /** Насколько за пределы экрана предрендерить строки (px). */
  drawDistance: number;
}

export const CHAT_DEFAULT_LAYOUT: IChatLayout = {
  bubbleCornerRadius: 18,
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
  pollVotesFont: font(12),
  pollBarHeight: 32,
  pollBarCornerRadius: 12,
  pollBarHPad: 12,
  pollHeaderSpacing: 10,
  pollOptionSpacing: 4,

  fileIconSize: 32,
  fileIconPointSize: 16,
  fileNameFont: font(13, "500"),
  fileSizeFont: font(11),
  fileRowSpacing: 2,
  fileContentSpacing: 6,
  filePadding: 6,
  fileCornerRadius: 8,

  emojiFonts: [font(48), font(40), font(34)],

  dateSeparatorFont: font(13, "500"),
  dateSeparatorVPad: 4,
  dateSeparatorHPad: 12,
  dateSeparatorCornerRadius: 12,

  collectionTopPadding: 8,
  collectionBottomPadding: 8,
  sectionSpacing: 6,

  fabMargin: 12,
  fabArrowSize: 18,
  fabShadowOpacity: 0.18,
  fabShadowRadius: 8,
  fabShadowOffsetY: 2,
  fabBadgeCornerRadius: 10,
  fabBadgeHeight: 20,
  fabBadgeMinWidth: 20,
  fabBadgeFont: font(12, "600", true),
  fabBadgePadH: 6,

  emptyStateFont: font(16),
  emptyStatePadding: 32,

  stickyDateShowDuration: 0.15,
  stickyDateHideDuration: 0.3,
  stickyDateHideDelay: 0.5,
  highlightAnimateIn: 0.2,
  highlightAnimateOut: 0.6,
  highlightDelay: 0.4,
  fabAnimationDuration: 0.25,

  longPressDuration: 0.35,

  scrollThrottleInterval: 1 / 30,

  estimatedRowHeight: 72,
  drawDistance: 300,
};
