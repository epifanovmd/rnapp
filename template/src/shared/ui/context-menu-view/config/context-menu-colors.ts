import { BlurViewProps } from "@react-native-community/blur";
import { Platform } from "react-native";

type BlurType = BlurViewProps["blurType"];

export interface IContextMenuColors {
  backdropColor: string;
  backdropBlurType: BlurType;

  panelBackground: string;
  panelShadowColor: string;
  panelShadowOpacity: number;
  panelShadowRadius: number;

  separatorColor: string;
  titleColor: string;
  destructiveColor: string;
  iconColor: string;
  highlightColor: string;
}

/** Материал размытия под меню: на iOS — системный, на Android — обычный. */
const LIGHT_BLUR: BlurType =
  Platform.OS === "ios" ? "ultraThinMaterial" : "light";
const DARK_BLUR: BlurType =
  Platform.OS === "ios" ? "ultraThinMaterialDark" : "dark";

/**
 * Палитра контекстного меню: светлая и тёмная. Снаружи не настраивается —
 * набор выбирается по схеме приложения.
 */
export const CONTEXT_MENU_COLORS: Record<"light" | "dark", IContextMenuColors> =
  {
    light: {
      backdropColor: "rgba(0, 0, 0, 0.3)",
      backdropBlurType: LIGHT_BLUR,

      panelBackground: "#FFFFFF",
      panelShadowColor: "#000000",
      panelShadowOpacity: 0.1,
      panelShadowRadius: 12,

      separatorColor: "rgb(217, 217, 217)",
      titleColor: "#000000",
      destructiveColor: "#FF3B30",
      iconColor: "rgb(51, 51, 51)",
      highlightColor: "rgb(237, 237, 237)",
    },

    dark: {
      backdropColor: "rgba(0, 0, 0, 0.5)",
      backdropBlurType: DARK_BLUR,

      panelBackground: "rgb(38, 38, 38)",
      panelShadowColor: "#000000",
      panelShadowOpacity: 0.35,
      panelShadowRadius: 16,

      separatorColor: "rgba(255, 255, 255, 0.12)",
      titleColor: "rgb(235, 235, 235)",
      destructiveColor: "rgb(255, 89, 89)",
      iconColor: "rgb(235, 235, 235)",
      highlightColor: "rgb(64, 64, 64)",
    },
  };
