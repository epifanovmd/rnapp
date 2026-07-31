import { Platform } from "react-native";

import { ContextMenuTheme } from "../types";

export interface IContextMenuTheme {
  backdropColor: string;
  backdropBlurType:
    "ultraThinMaterial" | "ultraThinMaterialDark" | "light" | "dark";

  emojiPanelBackground: string;
  emojiPanelCornerRadius: number;
  emojiPanelShadowColor: string;
  emojiPanelShadowOpacity: number;
  emojiPanelShadowRadius: number;
  emojiFontSize: number;
  emojiItemSize: number;

  menuBackground: string;
  menuCornerRadius: number;
  menuSeparatorColor: string;
  actionTitleFontSize: number;
  actionTitleColor: string;
  actionDestructiveTitleColor: string;
  actionIconColor: string;
  actionDestructiveIconColor: string;
  actionItemHeight: number;
  actionHorizontalPadding: number;
  actionHighlightColor: string;

  openDuration: number;
  closeDuration: number;
  springDamping: number;
  springVelocity: number;

  emojiPanelSpacing: number;
  menuSpacing: number;
  horizontalPadding: number;
  verticalPadding: number;
  menuWidth: number;

  snapOpenShift: number;
}

export const CONTEXT_MENU_SNAPSHOT_SHADOW = {
  color: "#000000",
  opacity: 0.12,
  radius: 8,
  offsetY: 3,
} as const;

const lightBlurType = Platform.OS === "ios" ? "ultraThinMaterial" : "light";
const darkBlurType = Platform.OS === "ios" ? "ultraThinMaterialDark" : "dark";

export const CONTEXT_MENU_LIGHT_THEME: IContextMenuTheme = {
  backdropColor: "rgba(0, 0, 0, 0.3)",
  backdropBlurType: lightBlurType,
  emojiPanelBackground: "#FFFFFF",
  emojiPanelCornerRadius: 16,
  emojiPanelShadowColor: "#000000",
  emojiPanelShadowOpacity: 0.1,
  emojiPanelShadowRadius: 12,
  emojiFontSize: 20,
  emojiItemSize: 32,
  menuBackground: "#FFFFFF",
  menuCornerRadius: 12,

  menuSeparatorColor: "rgb(217, 217, 217)",
  actionTitleFontSize: 15,
  actionTitleColor: "#000000",

  actionDestructiveTitleColor: "#FF3B30",

  actionIconColor: "rgb(51, 51, 51)",
  actionDestructiveIconColor: "#FF3B30",
  actionItemHeight: 38,
  actionHorizontalPadding: 14,

  actionHighlightColor: "rgb(237, 237, 237)",
  openDuration: 0.4,
  closeDuration: 0.26,
  springDamping: 0.82,
  springVelocity: 0.5,
  emojiPanelSpacing: 6,
  menuSpacing: 6,
  horizontalPadding: 12,
  verticalPadding: 10,
  menuWidth: 220,
  snapOpenShift: 6,
};

export const CONTEXT_MENU_DARK_THEME: IContextMenuTheme = {
  backdropColor: "rgba(0, 0, 0, 0.5)",
  backdropBlurType: darkBlurType,

  emojiPanelBackground: "rgb(38, 38, 38)",
  emojiPanelCornerRadius: 16,
  emojiPanelShadowColor: "#000000",
  emojiPanelShadowOpacity: 0.35,
  emojiPanelShadowRadius: 16,
  emojiFontSize: 20,
  emojiItemSize: 32,
  menuBackground: "rgb(38, 38, 38)",
  menuCornerRadius: 12,
  menuSeparatorColor: "rgba(255, 255, 255, 0.12)",
  actionTitleFontSize: 15,

  actionTitleColor: "rgb(235, 235, 235)",

  actionDestructiveTitleColor: "rgb(255, 89, 89)",
  actionIconColor: "rgb(235, 235, 235)",
  actionDestructiveIconColor: "rgb(255, 89, 89)",
  actionItemHeight: 38,
  actionHorizontalPadding: 14,

  actionHighlightColor: "rgb(64, 64, 64)",
  openDuration: 0.4,
  closeDuration: 0.26,
  springDamping: 0.82,
  springVelocity: 0.5,
  emojiPanelSpacing: 6,
  menuSpacing: 6,
  horizontalPadding: 12,
  verticalPadding: 10,
  menuWidth: 220,
  snapOpenShift: 6,
};

export const resolveContextMenuTheme = (
  name: ContextMenuTheme | string = "light",
): IContextMenuTheme =>
  name.toLowerCase() === "dark"
    ? CONTEXT_MENU_DARK_THEME
    : CONTEXT_MENU_LIGHT_THEME;
