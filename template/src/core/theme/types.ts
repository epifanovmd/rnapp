import { LIGHT_COLOR_THEME } from "./variants";

export type TColorTheme = typeof LIGHT_COLOR_THEME;

export interface IThemeContext extends ITheme {
  toggleTheme: () => void;
  isLight: boolean;
  isDark: boolean;
}

export type TThemeName = "Light" | "Dark";

export interface ITheme {
  name: TThemeName;
  colors: TColorTheme;
}
