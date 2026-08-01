import { createContext, useContext } from "react";
import { TextStyle } from "react-native";

/**
 * Собственный контекст InputBar — порт InputBarTheme + ChatLayout (input-
 * часть) + флаги из нативного модуля. InputBar не зависит от chat-view:
 * чат адаптируется к этому контексту, а не наоборот.
 *
 * Имена ключей совпадают с IChatViewTheme / IChatViewLayout / IChatViewFeatures,
 * поэтому при переходе с ChatViewContext на InputBarContext тела компонентов
 * не меняются — меняются только импорты и хук.
 */

// ─── Шрифт ───────────────────────────────────────────────────────────────────

export interface IChatFont {
  fontSize: number;
  fontWeight?: TextStyle["fontWeight"];
  monospacedDigits?: boolean;
}

const font = (
  fontSize: number,
  fontWeight?: TextStyle["fontWeight"],
  monospacedDigits?: boolean,
): IChatFont => ({ fontSize, fontWeight, monospacedDigits });

// ─── Тема ────────────────────────────────────────────────────────────────────

export interface IInputBarTheme {
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputTint: string;
  inputPlaceholder: string;
  inputReplyAccent: string;
  inputReplySender: string;
  inputReplyText: string;
  inputReplyClose: string;
  inputRecordingDot: string;
  inputRecordingCancel: string;
  inputRecordingMicFill: string;
  inputLockBackground: string;
  inputLockIcon: string;
}

const SYSTEM_BLUE = "rgb(0, 122, 255)";
const SYSTEM_RED = "rgb(255, 59, 48)";

export const INPUT_BAR_LIGHT_THEME: IInputBarTheme = {
  inputBackground: "#FFFFFF",
  inputBorder: "rgb(204, 204, 204)",
  inputText: "#000000",
  inputTint: SYSTEM_BLUE,
  inputPlaceholder: "rgb(153, 153, 153)",
  inputReplyAccent: SYSTEM_BLUE,
  inputReplySender: SYSTEM_BLUE,
  inputReplyText: "rgb(77, 77, 77)",
  inputReplyClose: "rgb(128, 128, 128)",
  inputRecordingDot: SYSTEM_RED,
  inputRecordingCancel: SYSTEM_RED,
  inputRecordingMicFill: SYSTEM_BLUE,
  inputLockBackground: "rgb(242, 242, 242)",
  inputLockIcon: "rgb(102, 102, 102)",
};

export const INPUT_BAR_DARK_THEME: IInputBarTheme = {
  inputBackground: "rgb(38, 48, 64)",
  inputBorder: "rgb(64, 64, 64)",
  inputText: "#FFFFFF",
  inputTint: "rgb(115, 191, 255)",
  inputPlaceholder: "rgb(115, 115, 115)",
  inputReplyAccent: "rgb(115, 191, 255)",
  inputReplySender: "rgb(115, 191, 255)",
  inputReplyText: "rgb(166, 166, 166)",
  inputReplyClose: "rgb(128, 128, 128)",
  inputRecordingDot: SYSTEM_RED,
  inputRecordingCancel: SYSTEM_RED,
  inputRecordingMicFill: "rgb(89, 153, 242)",
  inputLockBackground: "rgb(46, 56, 71)",
  inputLockIcon: "rgb(153, 153, 153)",
};

export const resolveInputBarTheme = (
  theme: "light" | "dark",
): IInputBarTheme =>
  theme === "dark" ? INPUT_BAR_DARK_THEME : INPUT_BAR_LIGHT_THEME;

// ─── Layout ──────────────────────────────────────────────────────────────────

export interface IInputBarLayout {
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
  inputReplyAccentWidth: number;
  inputReplySenderFont: IChatFont;
  inputReplyTextFont: IChatFont;
  inputPlaceholderText: string;
  inputSendButtonInset: number;
  inputSendButtonIconSize: number;
  // Запись
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
  recordTimerFont: IChatFont;
  recordCancelFont: IChatFont;
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

// ─── Features ────────────────────────────────────────────────────────────────

export interface IInputBarFeatures {
  showAttachButton: boolean;
  showVoiceRecording: boolean;
}

export const INPUT_BAR_DEFAULT_FEATURES: IInputBarFeatures = {
  showAttachButton: true,
  showVoiceRecording: true,
};

// ─── Контекст ────────────────────────────────────────────────────────────────

export interface IInputBarContextValue {
  theme: IInputBarTheme;
  layout: IInputBarLayout;
  features: IInputBarFeatures;
}

export const InputBarContext = createContext<IInputBarContextValue>({
  theme: INPUT_BAR_LIGHT_THEME,
  layout: INPUT_BAR_DEFAULT_LAYOUT,
  features: INPUT_BAR_DEFAULT_FEATURES,
});

export const useInputBarContext = () => useContext(InputBarContext);
