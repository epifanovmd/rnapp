import { TextStyle, ViewStyle } from "react-native";

import { ChatMessageOwnership } from "../types";
import { chatTextBase, withOpacity } from "../utils";
import { IChatFont, IChatViewLayout } from "./chat-layout";
import { IChatViewTheme } from "./chat-theme";

/**
 * Готовые стили ячейки сообщения, собранные один раз на пару (тема, лейаут).
 *
 * Цвета и метрики применяются к вью один раз при конфигурации, а не
 * пересчитываются на каждую перерисовку. В RN то же самое даёт главный выигрыш
 * в списке — ячейка больше не аллоцирует три десятка объектов стиля на рендер.
 */

const OWNERSHIPS: ChatMessageOwnership[] = [
  "mine",
  "theirs",
  "system",
  "pinned",
];

const font = (f: IChatFont, color: string, extra?: TextStyle): TextStyle => ({
  ...chatTextBase,
  fontSize: f.fontSize,
  fontWeight: f.fontWeight,
  color,
  ...(f.monospacedDigits ? { fontVariant: ["tabular-nums" as const] } : null),
  ...extra,
});

/** Стили, зависящие от принадлежности сообщения. */
export interface IChatOwnershipStyles {
  cell: ViewStyle;
  bubble: ViewStyle;
  text: TextStyle;
  link: TextStyle;
  time: TextStyle;
  edited: TextStyle;

  replyCard: ViewStyle;
  replyAccent: ViewStyle;
  replySender: TextStyle;
  replyText: TextStyle;

  forwardedAccent: ViewStyle;
  forwardedLabel: TextStyle;

  fileCard: ViewStyle;
  fileName: TextStyle;
  fileSize: TextStyle;
  fileIconColor: string;

  pollQuestion: TextStyle;
  pollOption: TextStyle;
  pollOptionSelected: TextStyle;
  pollPercent: TextStyle;
  pollPercentSelected: TextStyle;
  pollVotes: TextStyle;
  pollResults: TextStyle;

  voicePlayButton: ViewStyle;
  voiceDuration: TextStyle;
  /** Цвет активной части волны и кнопки play. */
  voiceAccent: string;
}

/** Стили, общие для всех сообщений. */
export interface IChatSharedStyles {
  avatarSlot: ViewStyle;
  /** Ширина колонки под аватар — она же вычитается из ширины пузыря. */
  avatarSlotWidth: number;
  senderName: TextStyle;

  footerRow: ViewStyle;
  reactionsWrap: ViewStyle;
  reactionChip: ViewStyle;
  reactionChipSelected: ViewStyle;
  reactionText: TextStyle;

  threadRow: ViewStyle;
  threadText: TextStyle;
  threadSeparator: TextStyle;
  threadReplier: TextStyle;

  /** Отступ текста под медиа. */
  mixedContentGap: ViewStyle;
  fileList: ViewStyle;
  mediaGrid: ViewStyle;
  mediaDurationBadge: ViewStyle;
  mediaDurationText: TextStyle;
  mediaOverlay: ViewStyle;
  mediaOverlayText: TextStyle;

  pollSubtitle: TextStyle;
  pollBar: ViewStyle;

  emoji: [TextStyle, TextStyle, TextStyle];

  dateSeparatorPill: ViewStyle;
  dateSeparatorText: TextStyle;
  emptyStateText: TextStyle;
  fabBadgeText: TextStyle;
}

export interface IChatStyles {
  byOwnership: Record<ChatMessageOwnership, IChatOwnershipStyles>;
  shared: IChatSharedStyles;
}

const bubbleColor = (
  ownership: ChatMessageOwnership,
  t: IChatViewTheme,
): string => {
  switch (ownership) {
    case "mine":
      return t.outgoingBubble;
    case "theirs":
      return t.incomingBubble;
    case "system":
      return t.systemBubble;
    case "pinned":
      return t.pinnedBubble;
  }
};

const textColor = (
  ownership: ChatMessageOwnership,
  t: IChatViewTheme,
): string => {
  switch (ownership) {
    case "mine":
      return t.outgoingText;
    case "theirs":
      return t.incomingText;
    case "system":
      return t.systemText;
    case "pinned":
      return t.pinnedText;
  }
};

const timeColor = (
  ownership: ChatMessageOwnership,
  t: IChatViewTheme,
): string => {
  switch (ownership) {
    case "mine":
      return t.outgoingTime;
    case "theirs":
      return t.incomingTime;
    case "system":
      return t.systemTime;
    case "pinned":
      return t.pinnedTime;
  }
};

const editedColor = (
  ownership: ChatMessageOwnership,
  t: IChatViewTheme,
): string => {
  switch (ownership) {
    case "mine":
      return t.outgoingEdited;
    case "theirs":
      return t.incomingEdited;
    default:
      return t.systemTime;
  }
};

/** Выравнивание строки по принадлежности сообщения: `justifyContent`. */
const justifyOf = (
  ownership: ChatMessageOwnership,
): ViewStyle["justifyContent"] => {
  switch (ownership) {
    case "mine":
      return "flex-end";
    case "theirs":
      return "flex-start";
    default:
      return "center";
  }
};

const extraSpacingOf = (
  ownership: ChatMessageOwnership,
  l: IChatViewLayout,
): number => {
  switch (ownership) {
    case "system":
      return l.systemCellBottomSpacing;
    case "pinned":
      return l.pinnedCellBottomSpacing;
    default:
      return 0;
  }
};

const ownershipStyles = (
  ownership: ChatMessageOwnership,
  t: IChatViewTheme,
  l: IChatViewLayout,
): IChatOwnershipStyles => {
  const isOutgoing = ownership === "mine";
  const spacing = extraSpacingOf(ownership, l);
  const voiceAccent = isOutgoing ? t.outgoingStatusRead : t.voiceWaveformActive;
  const color = textColor(ownership, t);

  return {
    cell: {
      flexDirection: "row",
      minHeight: l.cellMinHeight,
      paddingTop: l.cellVSpacing / 2 + spacing,
      paddingBottom: l.cellVSpacing / 2 + spacing,
      paddingHorizontal: l.cellHMargin,
      justifyContent: justifyOf(ownership),
    },
    bubble: {
      borderRadius: l.bubbleCornerRadius,
      backgroundColor: bubbleColor(ownership, t),
      overflow: "hidden",
      paddingTop: l.bubbleVPad,
      paddingBottom: l.bubbleBottomPad,
      paddingHorizontal: l.bubbleHPad,
      gap: l.bubbleSpacing,
    },
    text: font(l.messageFont, color, {
      textAlign: ownership === "system" ? "center" : "auto",
    }),
    link: font(l.messageFont, isOutgoing ? t.outgoingLink : t.incomingLink, {
      textDecorationLine: "underline",
    }),
    time: font(l.timeFont, timeColor(ownership, t)),
    edited: font(l.editedFont, editedColor(ownership, t)),

    replyCard: {
      flexDirection: "row",
      overflow: "hidden",
      height: l.replyHeight,
      borderRadius: l.replyCornerRadius,
      backgroundColor: isOutgoing
        ? t.outgoingReplyBackground
        : t.incomingReplyBackground,
    },
    replyAccent: {
      width: l.replyAccentWidth,
      backgroundColor: isOutgoing
        ? t.outgoingReplyAccent
        : t.incomingReplyAccent,
    },
    replySender: font(
      l.replySenderFont,
      isOutgoing ? t.outgoingReplySender : t.incomingReplySender,
    ),
    replyText: font(
      l.replyFont,
      isOutgoing ? t.outgoingReplyText : t.incomingReplyText,
      { marginTop: 1 },
    ),

    forwardedAccent: {
      width: l.forwardedAccentWidth,
      borderRadius: l.forwardedAccentWidth / 2,
      backgroundColor: isOutgoing
        ? t.outgoingForwardedAccent
        : t.incomingForwardedAccent,
    },
    forwardedLabel: font(
      l.forwardedFont,
      isOutgoing ? t.outgoingForwardedLabel : t.incomingForwardedLabel,
    ),

    fileCard: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: l.fileIconSize + l.filePadding * 2,
      borderRadius: l.fileCornerRadius,
      backgroundColor: isOutgoing
        ? t.outgoingFileBackground
        : t.incomingFileBackground,
      padding: l.filePadding,
    },
    fileName: font(l.fileNameFont, color),
    fileSize: font(l.fileSizeFont, timeColor(ownership, t), { marginTop: 1 }),
    fileIconColor: isOutgoing ? t.outgoingText : t.fileIconColor,

    pollQuestion: font(l.pollQuestionFont, color),
    pollOption: font(l.pollOptionFont, withOpacity(color, 0.8), {
      flexShrink: 1,
      marginLeft: l.pollBarHPad,
    }),
    pollOptionSelected: font(l.pollOptionFont, color, {
      fontWeight: "700",
      flexShrink: 1,
      marginLeft: l.pollBarHPad,
    }),
    pollPercent: font(l.pollPercentFont, timeColor(ownership, t), {
      marginLeft: 6,
      marginRight: l.pollBarHPad,
    }),
    pollPercentSelected: font(l.pollPercentFont, t.pollBarFilled, {
      marginLeft: 6,
      marginRight: l.pollBarHPad,
    }),
    pollVotes: font(l.pollVotesFont, timeColor(ownership, t)),
    pollResults: font(l.pollVotesFont, voiceAccent),

    voicePlayButton: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      width: l.voicePlaySize,
      height: l.voicePlaySize,
      borderRadius: l.voicePlaySize / 2,
      backgroundColor: voiceAccent,
    },
    voiceDuration: font(l.voiceDurationFont, timeColor(ownership, t), {
      marginTop: 2,
    }),
    voiceAccent,
  };
};

const sharedStyles = (
  t: IChatViewTheme,
  l: IChatViewLayout,
): IChatSharedStyles => ({
  // Колонка аватара всегда резервирует место, сам аватар рисуется слоем поверх.
  avatarSlot: {
    width: l.avatarSize + l.avatarLeadingMargin + l.avatarBubbleSpacing,
  },
  avatarSlotWidth: l.avatarSize + l.avatarLeadingMargin + l.avatarBubbleSpacing,
  senderName: font(l.senderNameFont, t.incomingSenderName),

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    height: l.footerHeight,
    gap: l.footerSpacing,
  },
  reactionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: l.reactionChipSpacing,
  },
  reactionChip: {
    alignItems: "center",
    justifyContent: "center",
    height: l.reactionChipHeight,
    borderRadius: l.reactionChipHeight / 2,
    paddingHorizontal: l.reactionChipPadding,
    backgroundColor: t.reactionBackground,
  },
  reactionChipSelected: {
    alignItems: "center",
    justifyContent: "center",
    height: l.reactionChipHeight,
    borderRadius: l.reactionChipHeight / 2,
    paddingHorizontal: l.reactionChipPadding,
    backgroundColor: t.reactionMineBackground,
    borderWidth: l.reactionBorderWidth,
    borderColor: t.reactionMineBorder,
  },
  reactionText: font(l.reactionFont, t.reactionText),

  threadRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    height: l.threadBarHeight,
    gap: l.threadBarSpacing,
  },
  threadText: font(l.threadBarFont, t.threadBarText),
  threadSeparator: font(l.threadBarFont, withOpacity(t.threadBarText, 0.5)),
  threadReplier: font(l.threadBarFont, withOpacity(t.threadBarText, 0.7), {
    flexShrink: 1,
  }),

  mixedContentGap: { marginTop: l.mixedContentSpacing },
  fileList: { gap: l.fileRowSpacing },
  mediaGrid: { overflow: "hidden", borderRadius: l.imageCornerRadius },
  mediaDurationBadge: {
    position: "absolute",
    right: l.mediaDurationMargin,
    bottom: l.mediaDurationMargin,
    borderRadius: l.mediaDurationCornerRadius,
    paddingHorizontal: l.mediaDurationPadH,
    paddingVertical: l.mediaDurationPadV,
    backgroundColor: t.mediaDurationBackground,
  },
  mediaDurationText: font(l.mediaDurationFont, t.mediaDurationTextColor),
  mediaOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.mediaOverlayBackground,
  },
  mediaOverlayText: font(l.mediaOverlayFont, t.mediaOverlayTextColor),

  pollSubtitle: font(l.pollSubtitleFont, t.pollSubtitleColor, { marginTop: 2 }),
  pollBar: {
    overflow: "hidden",
    justifyContent: "center",
    height: l.pollBarHeight,
    borderRadius: l.pollBarCornerRadius,
    backgroundColor: t.pollBarEmpty,
  },

  emoji: [
    {
      ...chatTextBase,
      textAlign: "center",
      fontSize: l.emojiFont1.fontSize,
      lineHeight: l.emojiFont1.fontSize * 1.2,
    },
    {
      ...chatTextBase,
      textAlign: "center",
      fontSize: l.emojiFont2.fontSize,
      lineHeight: l.emojiFont2.fontSize * 1.2,
    },
    {
      ...chatTextBase,
      textAlign: "center",
      fontSize: l.emojiFont3.fontSize,
      lineHeight: l.emojiFont3.fontSize * 1.2,
    },
  ],

  dateSeparatorPill: {
    borderRadius: l.dateSeparatorCornerRadius,
    backgroundColor: t.dateSeparatorBackground,
    paddingVertical: l.dateSeparatorVPad,
    paddingHorizontal: l.dateSeparatorHPad,
  },
  dateSeparatorText: font(l.dateSeparatorFont, t.dateSeparatorText),
  emptyStateText: font(l.emptyStateFont, t.emptyStateText, {
    textAlign: "center",
    paddingHorizontal: l.emptyStatePadding,
  }),
  fabBadgeText: font(l.fabBadgeFont, t.fabBadgeTextColor),
});

/** Собрать полный набор стилей чата. Вызывать только при смене темы/лейаута. */
export const createChatStyles = (
  theme: IChatViewTheme,
  layout: IChatViewLayout,
): IChatStyles => {
  const byOwnership = {} as Record<ChatMessageOwnership, IChatOwnershipStyles>;

  for (const ownership of OWNERSHIPS) {
    byOwnership[ownership] = ownershipStyles(ownership, theme, layout);
  }

  return { byOwnership, shared: sharedStyles(theme, layout) };
};
