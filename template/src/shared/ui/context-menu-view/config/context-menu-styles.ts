import { TextStyle, ViewStyle } from "react-native";
import { Easing } from "react-native-reanimated";

import {
  CONTEXT_MENU_ACTION_SEPARATOR_HEIGHT,
  CONTEXT_MENU_EMOJI_PANEL_PADDING,
  CONTEXT_MENU_SNAPSHOT_SHADOW,
  IContextMenuTheme,
} from "./context-menu-theme";

/**
 * Готовые стили меню, собранные один раз на тему. Компоненты меню не
 * вычисляют стили в рендере — как и ячейки чата (см. `chat-view/config`).
 */

/** Кривая нажатий эмодзи и пунктов меню — порт `curveEaseInOut`. */
export const CONTEXT_MENU_EASING = Easing.bezier(0.42, 0, 0.58, 1);

/** Отступ между иконкой и заголовком пункта. */
const ICON_TITLE_GAP = 10;

export interface IContextMenuStyles {
  /** Копия исходной вьюхи, поднятая над затемнением. */
  snapshot: ViewStyle;
  emojiPanel: ViewStyle;
  emojiItem: ViewStyle;
  emojiText: TextStyle;
  actionsPanel: ViewStyle;
  actionRow: ViewStyle;
  actionIcon: ViewStyle;
  actionTitle: TextStyle;
  actionDestructiveTitle: TextStyle;
  actionHighlight: ViewStyle;
  actionSeparator: ViewStyle;
  backdropTint: ViewStyle;
}

export const createContextMenuStyles = (
  t: IContextMenuTheme,
): IContextMenuStyles => ({
  snapshot: {
    shadowColor: CONTEXT_MENU_SNAPSHOT_SHADOW.color,
    shadowOpacity: CONTEXT_MENU_SNAPSHOT_SHADOW.opacity,
    shadowRadius: CONTEXT_MENU_SNAPSHOT_SHADOW.radius,
    shadowOffset: { width: 0, height: CONTEXT_MENU_SNAPSHOT_SHADOW.offsetY },
  },

  emojiPanel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: CONTEXT_MENU_EMOJI_PANEL_PADDING,
    borderCurve: "continuous",
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: t.emojiPanelBackground,
    borderRadius: t.emojiPanelCornerRadius,
    shadowColor: t.emojiPanelShadowColor,
    shadowOpacity: t.emojiPanelShadowOpacity,
    shadowRadius: t.emojiPanelShadowRadius,
  },
  emojiItem: {
    alignItems: "center",
    justifyContent: "center",
    width: t.emojiItemSize,
    height: t.emojiItemSize,
  },
  emojiText: { fontSize: t.emojiFontSize },

  actionsPanel: {
    flex: 1,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: t.menuBackground,
    borderRadius: t.menuCornerRadius,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    height: t.actionItemHeight,
    paddingHorizontal: t.actionHorizontalPadding,
  },
  actionIcon: { marginRight: ICON_TITLE_GAP },
  actionTitle: {
    flex: 1,
    fontSize: t.actionTitleFontSize,
    color: t.actionTitleColor,
  },
  actionDestructiveTitle: {
    flex: 1,
    fontSize: t.actionTitleFontSize,
    color: t.actionDestructiveTitleColor,
  },
  actionHighlight: { backgroundColor: t.actionHighlightColor },
  actionSeparator: {
    height: CONTEXT_MENU_ACTION_SEPARATOR_HEIGHT,
    backgroundColor: t.menuSeparatorColor,
  },

  backdropTint: { backgroundColor: t.backdropColor },
});
