/**
 * Тема панели ввода — порт `InputBarTheme` из IOSChatView.
 *
 * Имена ключей совпадают с `IChatViewTheme`, поэтому чат передаёт свою тему
 * как есть: InputBar от chat-view не зависит, зависимость идёт в другую сторону.
 */

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
