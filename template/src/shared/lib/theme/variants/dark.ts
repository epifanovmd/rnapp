import { ITheme } from "../types";

// Темная тема — цвета портированы из палитры проекта react-vite
export const DARK_COLOR_THEME = {
  textPrimary: "#FAFAFA",
  textSecondary: "#A1A1A1",
  textTertiary: "#525252",
  textDisabled: "#3A3A3A",

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

  slate50: "#2E2E2E",
  slate100: "#454545",
  slate200: "#5C5C5C",
  slate300: "#757575",
  slate400: "#8F8F8F",
  slate500: "#A8A8A8",
  slate600: "#C2C2C2",
  slate700: "#DBDBDB",
  slate800: "#EDEDED",
  slate900: "#F7F7F7",

  gray100: "#171717",
  gray300: "#404040",
  gray500: "#737373",
  gray700: "#D4D4D4",
  gray900: "#F2F2F2",

  green50: "#F2FDF4",
  green100: "#E0FBE4",
  green500: "#107823",
  green600: "#1CCF3C",
  green700: "#16A22F",

  orange50: "#FFFAF0",
  orange100: "#FFF3DB",
  orange500: "#C37F00",
  orange600: "#EB9900",
  orange700: "#B87800",

  red50: "#FFF1F0",
  red100: "#FEDDDC",
  red500: "#F9423D",
  red600: "#E40D07",
  red700: "#B20A06",

  // Семантические акценты (переиспользуют тона фона/шкалы, без выделенных цветов под кнопки)
  primary: "#2965FF",
  primaryForeground: "#FFFFFF",

  secondary: "#5C5C5C",
  secondaryForeground: "#FAFAFA",

  danger: "#F9423D",
  dangerForeground: "#FFFFFF",

  success: "#16A22F",
  warning: "#EB9900",
  info: "#5282FF",

  border: "#454545",
  textLink: "#5282FF",

  // Фоновые цвета
  background: "#0A0A0A",
  surface: "#121212",
  onSurface: "#181818",

  black: "#000000",
  white: "#FFFFFF",
  transparent: "transparent",
};

export const DARK_THEME: ITheme = {
  name: "Dark",
  colors: DARK_COLOR_THEME,
};
