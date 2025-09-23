import { ITheme, TColorTheme } from "../types";

export const DARK_COLOR_THEME: TColorTheme = {
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
  surface: "#191B23",
  surfaceBright: "#272A31",
  surfaceBrighter: "#2E3038",
  surfaceDim: "#11131A",

  background: "#0B0E15",
  backgroundDim: "#000000",
  backgroundDim64: "#00000064",

  // On colors
  onPrimaryHigh: "#FFFFFF",
  onPrimaryMedium: "#CCDAFF",
  onPrimaryDisabled: "#8F9099",

  onSecondaryHigh: "#FFFFFF",
  onSecondaryMedium: "#D3D9F0",
  onSecondaryDisabled: "#A4ABC0",

  onSurfaceHigh: "#EFF0FA",
  onSurfaceMedium: "#C5C6D0",
  onSurfaceDisabled: "#8F9099",

  // Border colors
  border: "#1D1F27",
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
