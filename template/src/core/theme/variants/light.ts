import { ITheme } from "../types";

export const LIGHT_COLOR_THEME = {
  // Primary colors
  primary: "#1976D2",
  primaryLight: "#42A5F5",
  primaryDark: "#1565C0",

  // Secondary colors
  secondary: "#DC004E",
  secondaryLight: "#FF5983",
  secondaryDark: "#9A0036",

  // Background colors
  background: "#ECE5C7",
  surface: "#F5F0DC",
  error: "#B00020",

  // On colors (text on colored backgrounds)
  onPrimary: "#FFFFFF",
  onSecondary: "#FFFFFF",
  onBackground: "#000000",
  onSurface: "#000000",
  onError: "#FFFFFF",

  // Text colors
  textPrimary: "rgba(0, 0, 0, 0.87)",
  textSecondary: "rgba(0, 0, 0, 0.6)",
  textDisabled: "rgba(0, 0, 0, 0.38)",
  textHint: "rgba(0, 0, 0, 0.38)",

  // Divider and borders
  divider: "rgba(0, 0, 0, 0.12)",
  border: "rgba(0, 0, 0, 0.12)",

  // States
  disabled: "rgba(0, 0, 0, 0.26)",
  hover: "rgba(0, 0, 0, 0.04)",
  focus: "rgba(0, 0, 0, 0.12)",
  selected: "rgba(0, 0, 0, 0.08)",
  activated: "rgba(0, 0, 0, 0.12)",
  pressed: "rgba(0, 0, 0, 0.16)",
  dragged: "rgba(0, 0, 0, 0.08)",

  // Elevation shadows (for surfaces)
  elevation0: "#FFFFFF",
  elevation1: "#FFFFFF",
  elevation2: "#FFFFFF",
  elevation3: "#FFFFFF",
  elevation4: "#FFFFFF",
  elevation6: "#FFFFFF",
  elevation8: "#FFFFFF",
  elevation12: "#FFFFFF",
  elevation16: "#FFFFFF",
  elevation24: "#FFFFFF",

  // Material Design color palette
  red: "#F44336",
  pink: "#E91E63",
  purple: "#9C27B0",
  deepPurple: "#673AB7",
  indigo: "#3F51B5",
  blue: "#2196F3",
  lightBlue: "#03A9F4",
  cyan: "#00BCD4",
  teal: "#009688",
  green: "#4CAF50",
  lightGreen: "#8BC34A",
  lime: "#CDDC39",
  yellow: "#FFEB3B",
  amber: "#FFC107",
  orange: "#FF9800",
  deepOrange: "#FF5722",
  brown: "#795548",
  grey: "#9E9E9E",
  blueGrey: "#607D8B",

  // Grey scale
  grey50: "#FAFAFA",
  grey100: "#F5F5F5",
  grey200: "#EEEEEE",
  grey300: "#E0E0E0",
  grey400: "#BDBDBD",
  grey500: "#9E9E9E",
  grey600: "#757575",
  grey700: "#616161",
  grey800: "#424242",
  grey900: "#212121",

  // Black and white
  black: "#000000",
  white: "#FFFFFF",

  // Transparent
  transparent: "transparent",
};

export const DEFAULT_LIGHT_THEME: ITheme = {
  name: "Light",
  colors: LIGHT_COLOR_THEME,
};
