import { ITheme } from "../types";

export const LIGHT_COLOR_THEME = {
  // Primary colors
  primary: "#2572ED",
  primaryBright: "#538DFF",
  primaryDim: "#002D6D",
  primaryDisabled: "#004299",

  // Secondary colors
  secondary: "#444954",
  secondaryBright: "#70778B",
  secondaryDim: "#293042",
  secondaryDisabled: "#404759",

  // Background colors
  surface: "#EFF0FA",
  surfaceBright: "#E7E7F2",
  surfaceBrighter: "#D8D9E3",
  surfaceDim: "#FAF8FF",

  background: "#FEFBFF",
  backgroundDim: "#FFFFFF",
  backgroundDim64: "#FFFFFF64",

  // On colors
  onPrimaryHigh: "#FFFFFF",
  onPrimaryMedium: "#CCDAFF",
  onPrimaryDisabled: "#A9ABB4",

  onSecondaryHigh: "#FFFFFF",
  onSecondaryMedium: "#D3D9F0",
  onSecondaryDisabled: "#A4ABC0",

  onSurfaceHigh: "#191B23",
  onSurfaceMedium: "#2E3038",
  onSurfaceDisabled: "#A9ABB4",

  // Border colors
  border: "#ECEDF7",
  borderLight: "#2D3440",

  // Alert colors
  alertGreen: "#36B37E",
  alertWarning: "#FFAB00",
  alertError: "#C74E5B",
  alertErrorBright: "#FFB2B6",
  alertErrorBrighter: "#FFEDEC",
  alertErrorDim: "#270005",
  alertErrorDisabled: "#8F3742",

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
