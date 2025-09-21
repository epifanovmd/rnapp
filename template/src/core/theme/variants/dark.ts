import { ITheme, TColorTheme } from "../types";

export const DARK_COLOR_THEME: TColorTheme = {
  // Primary colors
  primary: "#90CAF9",
  primaryLight: "#E3F2FD",
  primaryDark: "#42A5F5",

  // Secondary colors
  secondary: "#F48FB1",
  secondaryLight: "#FCE4EC",
  secondaryDark: "#EC407A",

  // Background colors
  background: "#354259",
  surface: "#2A3647",
  error: "#CF6679",

  // On colors (text on colored backgrounds)
  onPrimary: "#000000",
  onSecondary: "#000000",
  onBackground: "#FFFFFF",
  onSurface: "#FFFFFF",
  onError: "#000000",

  // Text colors
  textPrimary: "rgba(255, 255, 255, 0.87)",
  textSecondary: "rgba(255, 255, 255, 0.6)",
  textDisabled: "rgba(255, 255, 255, 0.38)",
  textHint: "rgba(255, 255, 255, 0.38)",

  // Divider and borders
  divider: "rgba(255, 255, 255, 0.12)",
  border: "rgba(255, 255, 255, 0.12)",

  // States
  disabled: "rgba(255, 255, 255, 0.26)",
  hover: "rgba(255, 255, 255, 0.04)",
  focus: "rgba(255, 255, 255, 0.12)",
  selected: "rgba(255, 255, 255, 0.08)",
  activated: "rgba(255, 255, 255, 0.12)",
  pressed: "rgba(255, 255, 255, 0.16)",
  dragged: "rgba(255, 255, 255, 0.08)",

  // Elevation surfaces (darker for dark theme)
  elevation0: "#121212",
  elevation1: "#1E1E1E",
  elevation2: "#222222",
  elevation3: "#242424",
  elevation4: "#272727",
  elevation6: "#2C2C2C",
  elevation8: "#2E2E2E",
  elevation12: "#333333",
  elevation16: "#363636",
  elevation24: "#383838",

  // Material Design color palette (lighter variants for dark theme)
  red: "#F44336",
  pink: "#F48FB1",
  purple: "#CE93D8",
  deepPurple: "#B39DDB",
  indigo: "#9FA8DA",
  blue: "#90CAF9",
  lightBlue: "#81D4FA",
  cyan: "#80DEEA",
  teal: "#80CBC4",
  green: "#A5D6A7",
  lightGreen: "#C5E1A5",
  lime: "#E6EE9C",
  yellow: "#FFF59D",
  amber: "#FFE082",
  orange: "#FFCC80",
  deepOrange: "#FFAB91",
  brown: "#BCAAA4",
  grey: "#EEEEEE",
  blueGrey: "#B0BEC5",

  // Grey scale (inverted for dark theme)
  grey50: "#212121",
  grey100: "#424242",
  grey200: "#616161",
  grey300: "#757575",
  grey400: "#9E9E9E",
  grey500: "#BDBDBD",
  grey600: "#E0E0E0",
  grey700: "#EEEEEE",
  grey800: "#F5F5F5",
  grey900: "#FAFAFA",

  // Black and white
  black: "#000000",
  white: "#FFFFFF",

  // Transparent
  transparent: "transparent",
};

export const DARK_THEME: ITheme = {
  name: "Dark",
  colors: DARK_COLOR_THEME,
};
