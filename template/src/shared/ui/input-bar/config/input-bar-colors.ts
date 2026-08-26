const SYSTEM_BLUE = "rgb(0, 122, 255)";
const SYSTEM_RED = "rgb(255, 59, 48)";

/**
 * Палитра панели ввода: цвета поля, панели ответа, записи и замка.
 * Снаружи не настраивается — набор выбирается по схеме приложения.
 */
export const INPUT_BAR_COLORS = {
  light: {
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
  },

  dark: {
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
  },
};

export type IInputBarColors = (typeof INPUT_BAR_COLORS)["light"];
