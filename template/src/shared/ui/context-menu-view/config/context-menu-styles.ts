import { TextStyle, ViewStyle } from "react-native";
import { Easing } from "react-native-reanimated";

import { CONTEXT_MENU_COLORS, IContextMenuColors } from "./context-menu-colors";

/** Стили меню, собранные один раз на палитру: в рендере ничего не считается. */

/** Кривая нажатий эмодзи и пунктов меню: easeInOut. */
export const CONTEXT_MENU_EASING = Easing.bezier(0.42, 0, 0.58, 1);

/** Метрики, от которых считается раскладка меню. */
export const CONTEXT_MENU_EMOJI_ITEM_SIZE = 32;
export const CONTEXT_MENU_EMOJI_PANEL_PADDING = 10;
export const CONTEXT_MENU_ACTION_ITEM_HEIGHT = 38;
export const CONTEXT_MENU_ACTION_SEPARATOR_HEIGHT = 0.5;
export const CONTEXT_MENU_WIDTH = 220;
/** Зазор между снапшотом и панелями, поля меню от краёв экрана. */
export const CONTEXT_MENU_PANEL_GAP = 6;
export const CONTEXT_MENU_SCREEN_PAD_H = 12;
export const CONTEXT_MENU_SCREEN_PAD_V = 10;
/** Насколько снапшот отъезжает от ближнего края экрана при открытии. */
export const CONTEXT_MENU_SNAP_OPEN_SHIFT = 6;

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

const createContextMenuStyles = (
  c: IContextMenuColors,
): IContextMenuStyles => ({
  // Тень копии исходной вьюхи, поднятой над затемнением.
  snapshot: {
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  emojiPanel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: CONTEXT_MENU_EMOJI_PANEL_PADDING,
    borderCurve: "continuous",
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: c.panelBackground,
    borderRadius: 16,
    shadowColor: c.panelShadowColor,
    shadowOpacity: c.panelShadowOpacity,
    shadowRadius: c.panelShadowRadius,
  },
  emojiItem: {
    alignItems: "center",
    justifyContent: "center",
    width: CONTEXT_MENU_EMOJI_ITEM_SIZE,
    height: CONTEXT_MENU_EMOJI_ITEM_SIZE,
  },
  emojiText: { fontSize: 20 },

  actionsPanel: {
    flex: 1,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: c.panelBackground,
    borderRadius: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    height: CONTEXT_MENU_ACTION_ITEM_HEIGHT,
    paddingHorizontal: 14,
  },
  actionIcon: { marginRight: ICON_TITLE_GAP },
  actionTitle: { flex: 1, fontSize: 15, color: c.titleColor },
  actionDestructiveTitle: { flex: 1, fontSize: 15, color: c.destructiveColor },
  actionHighlight: { backgroundColor: c.highlightColor },
  actionSeparator: {
    height: CONTEXT_MENU_ACTION_SEPARATOR_HEIGHT,
    backgroundColor: c.separatorColor,
  },

  backdropTint: { backgroundColor: c.backdropColor },
});

/** Цвета и стили под каждую схему — собраны один раз на модуле. */
const CONTEXT_MENU_SKIN = {
  light: {
    colors: CONTEXT_MENU_COLORS.light,
    styles: createContextMenuStyles(CONTEXT_MENU_COLORS.light),
  },
  dark: {
    colors: CONTEXT_MENU_COLORS.dark,
    styles: createContextMenuStyles(CONTEXT_MENU_COLORS.dark),
  },
};

export type IContextMenuSkin = (typeof CONTEXT_MENU_SKIN)["light"];

/** Палитра и стили меню по текущей схеме приложения. */
export const contextMenuSkin = (isDark: boolean): IContextMenuSkin =>
  isDark ? CONTEXT_MENU_SKIN.dark : CONTEXT_MENU_SKIN.light;
