import { ChatTheme } from "../types";

/**
 * Цвета темы чата и панели ввода: светлый и тёмный наборы
 * со значениями по умолчанию.
 */
export interface IChatViewTheme {
  isDark: boolean;

  backgroundColor: string;
  wallpaperColor: string;

  outgoingBubble: string;
  outgoingText: string;
  outgoingTime: string;
  outgoingStatus: string;
  outgoingStatusRead: string;
  outgoingEdited: string;
  outgoingLink: string;

  incomingBubble: string;
  incomingText: string;
  incomingTime: string;
  incomingEdited: string;
  incomingSenderName: string;
  incomingLink: string;

  systemBubble: string;
  systemText: string;
  systemTime: string;

  pinnedBubble: string;
  pinnedText: string;
  pinnedTime: string;

  outgoingReplyBackground: string;
  outgoingReplyAccent: string;
  outgoingReplySender: string;
  outgoingReplyText: string;
  incomingReplyBackground: string;
  incomingReplyAccent: string;
  incomingReplySender: string;
  incomingReplyText: string;

  outgoingForwardedLabel: string;
  incomingForwardedLabel: string;
  outgoingForwardedAccent: string;
  incomingForwardedAccent: string;

  outgoingFileBackground: string;
  incomingFileBackground: string;
  fileIconColor: string;

  reactionBackground: string;
  reactionMineBackground: string;
  reactionText: string;
  reactionMineBorder: string;

  threadBarText: string;
  threadBarIcon: string;

  dateSeparatorBackground: string;
  dateSeparatorText: string;

  fabBackground: string;
  fabBorder: string;
  fabArrowColor: string;
  fabBadgeBackground: string;
  fabBadgeTextColor: string;
  fabShadowColor: string;

  voiceWaveformActive: string;
  voiceWaveformInactive: string;

  pollBarFilled: string;
  pollBarEmpty: string;
  pollSubtitleColor: string;

  mediaPlaceholderBackground: string;
  mediaPlayIconColor: string;
  mediaPlayShadowColor: string;
  mediaDurationBackground: string;
  mediaDurationTextColor: string;
  mediaOverlayBackground: string;
  mediaOverlayTextColor: string;

  messageHighlightColor: string;

  emptyStateText: string;

  // ─── InputBarTheme ─────────────────────────────────────────────────────────

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

export const CHAT_LIGHT_THEME: IChatViewTheme = {
  isDark: false,

  backgroundColor: "rgb(240, 240, 245)",
  wallpaperColor: "rgb(214, 224, 237)",

  outgoingBubble: "rgb(224, 250, 214)",
  outgoingText: "#000000",
  outgoingTime: "rgba(0, 0, 0, 0.45)",
  outgoingStatus: "rgba(0, 0, 0, 0.35)",
  outgoingStatusRead: "rgb(51, 153, 89)",
  outgoingEdited: "rgba(0, 0, 0, 0.4)",
  outgoingLink: SYSTEM_BLUE,

  incomingBubble: "#FFFFFF",
  incomingText: "#000000",
  incomingTime: "rgba(0, 0, 0, 0.45)",
  incomingEdited: "rgba(0, 0, 0, 0.4)",
  incomingSenderName: SYSTEM_BLUE,
  incomingLink: SYSTEM_BLUE,

  systemBubble: "rgba(128, 128, 128, 0.12)",
  systemText: "rgb(102, 102, 102)",
  systemTime: "rgb(128, 128, 128)",

  pinnedBubble: "rgb(232, 237, 255)",
  pinnedText: "rgb(38, 38, 64)",
  pinnedTime: "rgb(89, 102, 153)",

  outgoingReplyBackground: "rgb(199, 237, 189)",
  outgoingReplyAccent: "rgb(51, 153, 89)",
  outgoingReplySender: "rgb(51, 153, 89)",
  outgoingReplyText: "rgba(0, 0, 0, 0.7)",
  incomingReplyBackground: "rgb(237, 237, 242)",
  incomingReplyAccent: SYSTEM_BLUE,
  incomingReplySender: SYSTEM_BLUE,
  incomingReplyText: "rgba(0, 0, 0, 0.7)",

  outgoingForwardedLabel: "rgb(51, 153, 89)",
  incomingForwardedLabel: SYSTEM_BLUE,
  outgoingForwardedAccent: "rgb(51, 153, 89)",
  incomingForwardedAccent: SYSTEM_BLUE,

  outgoingFileBackground: "rgb(199, 237, 189)",
  incomingFileBackground: "rgb(237, 237, 242)",
  fileIconColor: SYSTEM_BLUE,

  reactionBackground: "rgb(237, 237, 237)",
  reactionMineBackground: "rgba(0, 122, 255, 0.15)",
  reactionText: "#000000",
  reactionMineBorder: "rgba(0, 122, 255, 0.5)",

  threadBarText: SYSTEM_BLUE,
  threadBarIcon: SYSTEM_BLUE,

  dateSeparatorBackground: "rgba(0, 0, 0, 0.08)",
  dateSeparatorText: "rgba(0, 0, 0, 0.5)",

  fabBackground: "#FFFFFF",
  fabBorder: "rgb(204, 204, 204)",
  fabArrowColor: "rgb(64, 140, 230)",
  fabBadgeBackground: "rgb(64, 140, 230)",
  fabBadgeTextColor: "#FFFFFF",
  fabShadowColor: "rgba(51, 102, 179, 0.3)",

  voiceWaveformActive: SYSTEM_BLUE,
  voiceWaveformInactive: "rgb(191, 191, 191)",

  pollBarFilled: "rgb(89, 166, 242)",
  pollBarEmpty: "rgba(0, 0, 0, 0.05)",
  pollSubtitleColor: "rgba(0, 0, 0, 0.4)",

  mediaPlaceholderBackground: "rgb(230, 230, 230)",
  mediaPlayIconColor: "#FFFFFF",
  mediaPlayShadowColor: "#000000",
  mediaDurationBackground: "rgba(0, 0, 0, 0.5)",
  mediaDurationTextColor: "#FFFFFF",
  mediaOverlayBackground: "rgba(0, 0, 0, 0.55)",
  mediaOverlayTextColor: "#FFFFFF",

  messageHighlightColor: "rgba(255, 204, 0, 0.3)",

  emptyStateText: "rgb(128, 128, 128)",

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

export const CHAT_DARK_THEME: IChatViewTheme = {
  isDark: true,

  backgroundColor: "rgb(15, 23, 33)",
  wallpaperColor: "rgb(15, 23, 33)",

  outgoingBubble: "rgb(43, 82, 120)",
  outgoingText: "#FFFFFF",
  outgoingTime: "rgba(255, 255, 255, 0.5)",
  outgoingStatus: "rgba(255, 255, 255, 0.4)",
  outgoingStatusRead: "rgb(102, 204, 140)",
  outgoingEdited: "rgba(255, 255, 255, 0.45)",
  outgoingLink: "rgb(115, 191, 255)",

  incomingBubble: "rgb(28, 38, 51)",
  incomingText: "#FFFFFF",
  incomingTime: "rgba(255, 255, 255, 0.5)",
  incomingEdited: "rgba(255, 255, 255, 0.45)",
  incomingSenderName: "rgb(115, 191, 255)",
  incomingLink: "rgb(115, 191, 255)",

  systemBubble: "rgba(255, 255, 255, 0.08)",
  systemText: "rgba(255, 255, 255, 0.6)",
  systemTime: "rgba(255, 255, 255, 0.4)",

  pinnedBubble: "rgb(38, 46, 71)",
  pinnedText: "rgb(209, 217, 242)",
  pinnedTime: "rgb(128, 140, 184)",

  outgoingReplyBackground: "rgb(36, 69, 102)",
  outgoingReplyAccent: "rgb(102, 204, 140)",
  outgoingReplySender: "rgb(102, 204, 140)",
  outgoingReplyText: "rgba(255, 255, 255, 0.6)",
  incomingReplyBackground: "rgb(36, 46, 61)",
  incomingReplyAccent: "rgb(115, 191, 255)",
  incomingReplySender: "rgb(115, 191, 255)",
  incomingReplyText: "rgba(255, 255, 255, 0.6)",

  outgoingForwardedLabel: "rgb(102, 204, 140)",
  incomingForwardedLabel: "rgb(115, 191, 255)",
  outgoingForwardedAccent: "rgb(102, 204, 140)",
  incomingForwardedAccent: "rgb(115, 191, 255)",

  outgoingFileBackground: "rgb(36, 69, 102)",
  incomingFileBackground: "rgb(36, 46, 61)",
  fileIconColor: "rgb(115, 191, 255)",

  reactionBackground: "rgb(51, 51, 51)",
  reactionMineBackground: "rgba(0, 122, 255, 0.25)",
  reactionText: "#FFFFFF",
  reactionMineBorder: "rgba(0, 122, 255, 0.6)",

  threadBarText: SYSTEM_BLUE,
  threadBarIcon: SYSTEM_BLUE,

  dateSeparatorBackground: "rgba(255, 255, 255, 0.08)",
  dateSeparatorText: "rgba(255, 255, 255, 0.5)",

  fabBackground: "rgb(38, 48, 64)",
  fabBorder: "rgb(64, 64, 64)",
  fabArrowColor: "rgb(115, 179, 255)",
  fabBadgeBackground: "rgb(89, 153, 242)",
  fabBadgeTextColor: "#FFFFFF",
  fabShadowColor: "rgba(0, 0, 0, 0.4)",

  voiceWaveformActive: "rgb(115, 191, 255)",
  voiceWaveformInactive: "rgb(89, 89, 89)",

  pollBarFilled: "rgb(89, 153, 230)",
  pollBarEmpty: "rgba(255, 255, 255, 0.06)",
  pollSubtitleColor: "rgba(255, 255, 255, 0.4)",

  mediaPlaceholderBackground: "rgb(51, 51, 51)",
  mediaPlayIconColor: "#FFFFFF",
  mediaPlayShadowColor: "#000000",
  mediaDurationBackground: "rgba(0, 0, 0, 0.5)",
  mediaDurationTextColor: "#FFFFFF",
  mediaOverlayBackground: "rgba(0, 0, 0, 0.55)",
  mediaOverlayTextColor: "#FFFFFF",

  messageHighlightColor: "rgba(255, 204, 0, 0.3)",

  emptyStateText: "rgb(128, 128, 128)",

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

export const resolveChatTheme = (
  theme: ChatTheme | undefined,
): IChatViewTheme => (theme === "dark" ? CHAT_DARK_THEME : CHAT_LIGHT_THEME);
