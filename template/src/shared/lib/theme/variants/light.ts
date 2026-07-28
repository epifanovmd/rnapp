import { ITheme } from "../types";

// Светлая тема — цвета портированы из палитры проекта react-vite
export const LIGHT_COLOR_THEME = {
  textPrimary: "#0A0A0A",
  textSecondary: "#717182",
  textTertiary: "#A1A1A1",
  textDisabled: "#CBCED4",

  blue50: "#F0F4FF",
  blue100: "#DBE5FF",
  blue200: "#B8CCFF",
  blue300: "#85A7FF",
  blue400: "#5282FF",
  blue500: "#2965FF",
  blue600: "#0042EB",
  blue700: "#0033B8",
  blue800: "#00278A",
  blue900: "#001A5C",

  slate50: "#F7F7F7",
  slate100: "#EDEDED",
  slate200: "#DBDBDB",
  slate300: "#C2C2C2",
  slate400: "#A8A8A8",
  slate500: "#8F8F8F",
  slate600: "#757575",
  slate700: "#5C5C5C",
  slate800: "#454545",
  slate900: "#2E2E2E",

  gray100: "#F2F2F2",
  gray300: "#D4D4D4",
  gray500: "#737373",
  gray700: "#404040",
  gray900: "#171717",

  green50: "#F3FCF4",
  green100: "#E3F7E6",
  green500: "#278733",
  green600: "#35B645",
  green700: "#298E36",

  orange50: "#FDF9F1",
  orange100: "#FBF1DF",
  orange500: "#E49E22",
  orange600: "#D18F1A",
  orange700: "#A47014",

  red50: "#FDF1F4",
  red100: "#FBDFE5",
  red500: "#D4183D",
  red600: "#D3183D",
  red700: "#A5132F",

  // Семантические акценты (переиспользуют тона фона/шкалы, без выделенных цветов под кнопки)
  primary: "#2965FF",
  primaryForeground: "#FFFFFF",

  secondary: "#DBDBDB",
  secondaryForeground: "#0A0A0A",

  danger: "#D4183D",
  dangerForeground: "#FFFFFF",

  // Фоновые цвета
  background: "#FFFFFF",
  surface: "#F9F9FB",
  onSurface: "#F3F3F5",

  black: "#000000",
  white: "#FFFFFF",
  transparent: "transparent",
};

export const DEFAULT_LIGHT_THEME: ITheme = {
  name: "Light",
  colors: LIGHT_COLOR_THEME,
};
