import { TextStyle } from "react-native";

/**
 * Метрики панели ввода — порт input-части `ChatLayout`. Имена ключей совпадают
 * с `IChatViewLayout`, поэтому чат передаёт свой layout как есть.
 */

export interface IInputBarFont {
  fontSize: number;
  fontWeight?: TextStyle["fontWeight"];
  monospacedDigits?: boolean;
}

const font = (
  fontSize: number,
  fontWeight?: TextStyle["fontWeight"],
  monospacedDigits?: boolean,
): IInputBarFont => ({ fontSize, fontWeight, monospacedDigits });

export interface IInputBarLayout {
  inputBarMinHeight: number;
  inputBarVPad: number;
  inputBarHPad: number;
  textViewMinHeight: number;
  textViewMaxHeight: number;
  textViewCornerRadius: number;
  textViewFont: IInputBarFont;
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
  inputReplyAccentWidth: number;
  inputReplySenderFont: IInputBarFont;
  inputReplyTextFont: IInputBarFont;
  inputPlaceholderText: string;
  inputSendButtonInset: number;
  inputSendButtonIconSize: number;

  // Запись голосового
  recordFloatingMicIconSize: number;
  recordLockChevronSize: number;
  recordLockButtonIconSize: number;
  recordLockBottomMargin: number;
  recordLockChevronTopPad: number;
  recordLockIconCenterOffset: number;
  recordDotLeading: number;
  recordTimerLeading: number;
  recordSlideHintOffset: number;
  recordDotSize: number;
  recordTimerFont: IInputBarFont;
  recordCancelFont: IInputBarFont;
  recordDotMinAlpha: number;
  recordCancelThreshold: number;
  recordLockThreshold: number;
  recordLockIconSize: number;
  recordLockContainerSize: number;
  recordMinPressDuration: number;
  recordPulseBaseScale: number;
  recordPulseMaxScale: number;
  recordPulseDuration: number;
}

export const INPUT_BAR_DEFAULT_LAYOUT: IInputBarLayout = {
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
  inputReplyAccentWidth: 2.5,
  inputReplySenderFont: font(13, "600"),
  inputReplyTextFont: font(13),
  inputPlaceholderText: "Сообщение",
  inputSendButtonInset: 4,
  inputSendButtonIconSize: 14,

  recordFloatingMicIconSize: 18,
  recordLockChevronSize: 10,
  recordLockButtonIconSize: 14,
  recordLockBottomMargin: 8,
  recordLockChevronTopPad: 6,
  recordLockIconCenterOffset: 5,
  recordDotLeading: 12,
  recordTimerLeading: 8,
  recordSlideHintOffset: 20,
  recordDotSize: 10,
  recordTimerFont: font(16, "400", true),
  recordCancelFont: font(14),
  recordDotMinAlpha: 0.2,
  recordCancelThreshold: 100,
  recordLockThreshold: 70,
  recordLockIconSize: 24,
  recordLockContainerSize: 44,
  recordMinPressDuration: 0.15,
  recordPulseBaseScale: 1.15,
  recordPulseMaxScale: 1.28,
  recordPulseDuration: 0.6,
};
