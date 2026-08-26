import { TextStyle, ViewStyle } from "react-native";

import { ChatMessageOwnership } from "../types";
import { chatTextBase, withOpacity } from "../utils";
import { CHAT_COLORS, IChatColors } from "./chat-colors";

/**
 * Готовые стили ячейки сообщения, собранные один раз на палитру.
 *
 * Метрики — литералы прямо здесь: чат ими не конфигурируется. Стили строятся
 * на модуле, а не на рендере: ячейка не аллоцирует три десятка объектов стиля
 * на каждую перерисовку.
 */

const OWNERSHIPS: ChatMessageOwnership[] = [
  "mine",
  "theirs",
  "system",
  "pinned",
];

/** Кегли сообщений из 1, 2 и 3 эмодзи. */
const EMOJI_SIZES = [48, 40, 34];

/** Ширина колонки под аватар — она же вычитается из ширины пузыря. */
export const CHAT_AVATAR_SLOT_WIDTH = 44;

/** Верхний и нижний отступ контента списка. */
export const CHAT_CONTENT_PADDING = 8;

/**
 * Полная высота строки-разделителя дат: отступы строки, паддинги плашки,
 * строка текста. Высота известна заранее, поэтому список получает её как
 * фиксированную (`getFixedItemSize`) и не меряет каждую плашку.
 */
export const CHAT_DATE_SEPARATOR_ROW_HEIGHT = 2 * 6 + 2 * 4 + 16;

const text = (
  fontSize: number,
  color: string,
  extra?: TextStyle,
): TextStyle => ({ ...chatTextBase, fontSize, color, ...extra });

/** Табличные цифры — одинаковой ширины, для выровненных чисел. */
const TABULAR: TextStyle = { fontVariant: ["tabular-nums"] };

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
  /** Резерв под аватар входящего сообщения — сдвигает пузырь вправо. */
  avatarColumn: ViewStyle;
  /** Аватар поверх ячейки (absolute): низ аватара совпадает с низом пузыря. */
  avatarOverlay: ViewStyle;
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
  c: IChatColors,
): string => {
  switch (ownership) {
    case "mine":
      return c.outgoingBubble;
    case "theirs":
      return c.incomingBubble;
    case "system":
      return c.systemBubble;
    case "pinned":
      return c.pinnedBubble;
  }
};

const textColor = (ownership: ChatMessageOwnership, c: IChatColors): string => {
  switch (ownership) {
    case "mine":
      return c.outgoingText;
    case "theirs":
      return c.incomingText;
    case "system":
      return c.systemText;
    case "pinned":
      return c.pinnedText;
  }
};

const timeColor = (ownership: ChatMessageOwnership, c: IChatColors): string => {
  switch (ownership) {
    case "mine":
      return c.outgoingTime;
    case "theirs":
      return c.incomingTime;
    case "system":
      return c.systemTime;
    case "pinned":
      return c.pinnedTime;
  }
};

const editedColor = (
  ownership: ChatMessageOwnership,
  c: IChatColors,
): string => {
  switch (ownership) {
    case "mine":
      return c.outgoingEdited;
    case "theirs":
      return c.incomingEdited;
    default:
      return c.systemTime;
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

/** Системные и закреплённые сообщения стоят особняком — им нужен воздух. */
const extraSpacingOf = (ownership: ChatMessageOwnership): number => {
  switch (ownership) {
    case "system":
      return 20;
    case "pinned":
      return 32;
    default:
      return 0;
  }
};

const ownershipStyles = (
  ownership: ChatMessageOwnership,
  c: IChatColors,
): IChatOwnershipStyles => {
  const isOutgoing = ownership === "mine";
  const spacing = extraSpacingOf(ownership);
  const voiceAccent = isOutgoing ? c.outgoingStatusRead : c.voiceWaveformActive;
  const color = textColor(ownership, c);

  return {
    cell: {
      flexDirection: "row",
      minHeight: 36,
      paddingTop: 1 + spacing,
      paddingBottom: 1 + spacing,
      paddingHorizontal: 8,
      justifyContent: justifyOf(ownership),
    },
    bubble: {
      borderRadius: 18,
      backgroundColor: bubbleColor(ownership, c),
      overflow: "hidden",
      paddingTop: 6,
      paddingBottom: 5,
      paddingHorizontal: 12,
      gap: 4,
      // Пузырь заполняет ячейку по высоте. System/pinned — нет, у них свой
      // дополнительный нижний отступ.
      ...(ownership === "mine" || ownership === "theirs"
        ? { minHeight: 34 }
        : null),
    },
    text: text(15, color, {
      textAlign: ownership === "system" ? "center" : "auto",
    }),
    link: text(15, isOutgoing ? c.outgoingLink : c.incomingLink, {
      textDecorationLine: "underline",
    }),
    time: text(11, timeColor(ownership, c)),
    edited: text(11, editedColor(ownership, c)),

    replyCard: {
      flexDirection: "row",
      overflow: "hidden",
      height: 38,
      borderRadius: 6,
      backgroundColor: isOutgoing
        ? c.outgoingReplyBackground
        : c.incomingReplyBackground,
    },
    replyAccent: {
      width: 2.5,
      backgroundColor: isOutgoing
        ? c.outgoingReplyAccent
        : c.incomingReplyAccent,
    },
    replySender: text(
      13,
      isOutgoing ? c.outgoingReplySender : c.incomingReplySender,
      { fontWeight: "600" },
    ),
    replyText: text(
      13,
      isOutgoing ? c.outgoingReplyText : c.incomingReplyText,
      { marginTop: 1 },
    ),

    forwardedAccent: {
      width: 2.5,
      borderRadius: 1.25,
      backgroundColor: isOutgoing
        ? c.outgoingForwardedAccent
        : c.incomingForwardedAccent,
    },
    forwardedLabel: text(
      13,
      isOutgoing ? c.outgoingForwardedLabel : c.incomingForwardedLabel,
      { fontWeight: "500" },
    ),

    fileCard: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 44,
      borderRadius: 8,
      backgroundColor: isOutgoing
        ? c.outgoingFileBackground
        : c.incomingFileBackground,
      padding: 6,
    },
    fileName: text(13, color, { fontWeight: "500" }),
    fileSize: text(11, timeColor(ownership, c), { marginTop: 1 }),
    fileIconColor: isOutgoing ? c.outgoingText : c.fileIconColor,

    pollQuestion: text(15, color, { fontWeight: "600" }),
    pollOption: text(14, withOpacity(color, 0.8), {
      fontWeight: "500",
      flexShrink: 1,
      marginLeft: 12,
    }),
    pollOptionSelected: text(14, color, {
      fontWeight: "700",
      flexShrink: 1,
      marginLeft: 12,
    }),
    pollPercent: text(13, timeColor(ownership, c), {
      ...TABULAR,
      fontWeight: "600",
      marginLeft: 6,
      marginRight: 12,
    }),
    pollPercentSelected: text(13, c.pollBarFilled, {
      ...TABULAR,
      fontWeight: "600",
      marginLeft: 6,
      marginRight: 12,
    }),
    pollVotes: text(12, timeColor(ownership, c)),
    pollResults: text(12, voiceAccent),

    voicePlayButton: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: voiceAccent,
    },
    voiceDuration: text(12, timeColor(ownership, c), {
      ...TABULAR,
      fontWeight: "500",
      marginTop: 2,
    }),
    voiceAccent,
  };
};

const sharedStyles = (c: IChatColors): IChatSharedStyles => ({
  // Резерв под аватар — пустой спейсер. Сдвигает пузырь входящего вправо.
  avatarColumn: { width: CHAT_AVATAR_SLOT_WIDTH },
  // Аватар абсолютным позиционированием поверх ячейки.
  avatarOverlay: {
    position: "absolute",
    left: 6,
    bottom: 1,
    width: 36,
    height: 36,
  },
  senderName: text(13, c.incomingSenderName, { fontWeight: "600" }),

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    height: 16,
    gap: 3,
  },
  reactionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
  },
  reactionChip: {
    alignItems: "center",
    justifyContent: "center",
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: c.reactionBackground,
  },
  reactionChipSelected: {
    alignItems: "center",
    justifyContent: "center",
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: c.reactionMineBackground,
    borderWidth: 1,
    borderColor: c.reactionMineBorder,
  },
  reactionText: text(13, c.reactionText),

  threadRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    height: 28,
    gap: 4,
  },
  threadText: text(13, c.threadBarText, { fontWeight: "500" }),
  threadSeparator: text(13, withOpacity(c.threadBarText, 0.5), {
    fontWeight: "500",
  }),
  threadReplier: text(13, withOpacity(c.threadBarText, 0.7), {
    fontWeight: "500",
    flexShrink: 1,
  }),

  mixedContentGap: { marginTop: 4 },
  fileList: { gap: 2 },
  mediaGrid: { overflow: "hidden", borderRadius: 12 },
  mediaDurationBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: c.mediaDurationBackground,
  },
  mediaDurationText: text(12, c.mediaDurationTextColor, {
    ...TABULAR,
    fontWeight: "500",
  }),
  mediaOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.mediaOverlayBackground,
  },
  mediaOverlayText: text(28, c.mediaOverlayTextColor, { fontWeight: "600" }),

  pollSubtitle: text(12, c.pollSubtitleColor, { marginTop: 2 }),
  pollBar: {
    overflow: "hidden",
    justifyContent: "center",
    height: 32,
    borderRadius: 12,
    backgroundColor: c.pollBarEmpty,
  },

  emoji: EMOJI_SIZES.map(size => ({
    ...chatTextBase,
    textAlign: "center" as const,
    fontSize: size,
    lineHeight: size * 1.2,
  })) as unknown as [TextStyle, TextStyle, TextStyle],

  dateSeparatorPill: {
    borderRadius: 12,
    backgroundColor: c.dateSeparatorBackground,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  dateSeparatorText: text(13, c.dateSeparatorText, {
    fontWeight: "500",
    lineHeight: 16,
  }),
  emptyStateText: text(16, c.emptyStateText, {
    textAlign: "center",
    paddingHorizontal: 32,
  }),
  fabBadgeText: text(12, c.fabBadgeTextColor, {
    ...TABULAR,
    fontWeight: "600",
  }),
});

const createChatStyles = (c: IChatColors): IChatStyles => {
  const byOwnership = {} as Record<ChatMessageOwnership, IChatOwnershipStyles>;

  for (const ownership of OWNERSHIPS) {
    byOwnership[ownership] = ownershipStyles(ownership, c);
  }

  return { byOwnership, shared: sharedStyles(c) };
};

/** Цвета и стили под каждую схему — собраны один раз на модуле. */
export const CHAT_SKIN = {
  light: {
    colors: CHAT_COLORS.light,
    styles: createChatStyles(CHAT_COLORS.light),
  },
  dark: {
    colors: CHAT_COLORS.dark,
    styles: createChatStyles(CHAT_COLORS.dark),
  },
};

export type IChatSkin = (typeof CHAT_SKIN)["light"];
