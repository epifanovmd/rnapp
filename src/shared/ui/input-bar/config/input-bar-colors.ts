import type { TColorTheme } from "../../../lib/theme";

/**
 * Палитра панели ввода: цвета поля, панели ответа, записи и замка.
 * Снаружи не настраивается — целиком выводится из токенов темы, поэтому панель
 * читается как одна семья с плавающими кнопками чата.
 */
export interface IInputBarColors {
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  /** Иконки круглых кнопок — нейтральные, как у `Fab`. */
  inputIcon: string;
  /** Акцент заливок: отправка, зафиксированный микрофон, полоска ответа. */
  inputAccent: string;
  inputAccentForeground: string;
  inputPlaceholder: string;
  inputReplyAccent: string;
  inputReplySender: string;
  inputReplyText: string;
  inputReplyClose: string;
  inputRecordingDot: string;
  inputRecordingCancel: string;
  inputLockBackground: string;
  inputLockIcon: string;
}

export const inputBarColors = (c: TColorTheme): IInputBarColors => ({
  inputBackground: c.surface,
  inputBorder: c.border,
  inputText: c.textPrimary,
  inputIcon: c.textPrimary,
  inputAccent: c.primary,
  inputAccentForeground: c.primaryForeground,
  inputPlaceholder: c.textTertiary,
  inputReplyAccent: c.primary,
  inputReplySender: c.primary,
  inputReplyText: c.textSecondary,
  inputReplyClose: c.textTertiary,
  inputRecordingDot: c.danger,
  inputRecordingCancel: c.danger,
  inputLockBackground: c.onSurface,
  inputLockIcon: c.textSecondary,
});
