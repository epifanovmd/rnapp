// Theme.interface.ts
export interface ColorTheme {
  common: {
    black: string;
    white: string;
  };

  primary: {
    main: string;
    light: 'rgb(73, 100, 169)';
    dark: 'rgb(19, 43, 103)';
    contrastText: string;
  };
  secondary: {
    main: string;
    light: 'rgb(241, 87, 79)';
    dark: 'rgb(166, 32, 25)';
    contrastText: string;
  };

  error: {
    light: string;
    main: string;
    dark: string;
    contrastText: string;
  };

  warning: {
    light: string;
    main: string;
    dark: string;
    contrastText: string;
  };

  info: {
    light: string;
    main: string;
    dark: string;
    contrastText: string;
  };
  success: {
    light: string;
    main: string;
    dark: string;
    contrastText: string;
  };

  grey: {
    grey50: string;
    grey100: string;
    grey200: string;
    grey300: string;
    grey400: string;
    grey500: string;
    grey600: string;
    grey700: string;
    grey800: string;
    grey900: string;
    greyA100: string;
    greyA200: string;
    greyA400: string;
    greyA700: string;
  };
}
export interface SpacingTheme {
  base: number;
  double: number;
}
export interface Theme {
  id: string;
  color: ColorTheme;
  spacing: SpacingTheme;
}
