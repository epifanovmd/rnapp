const SYSTEM_BLUE = "rgb(0, 122, 255)";

/**
 * Палитра чата: светлая и тёмная. Снаружи не настраивается — набор выбирается
 * по схеме приложения (`useTheme().isDark`).
 */
export const CHAT_COLORS = {
  light: {
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
  },

  dark: {
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
  },
};

export type IChatColors = (typeof CHAT_COLORS)["light"];
