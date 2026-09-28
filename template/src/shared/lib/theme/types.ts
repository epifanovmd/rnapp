import { createInjectDecorator } from "@shared/lib/di";

import { LIGHT_COLOR_THEME } from "./variants";

export type TColorTheme = typeof LIGHT_COLOR_THEME;

export type TThemeName = "Light" | "Dark";

/** Light/Dark — явный выбор пользователя; System — следовать схеме ОС. */
export type TThemePreference = TThemeName | "System";

export interface ITheme {
  name: TThemeName;
  colors: TColorTheme;
}

export interface IThemeContext extends ITheme {
  /** Сохранённое предпочтение; name — фактическая применённая тема. */
  preference: TThemePreference;
  isLight: boolean;
  isDark: boolean;
  setTheme: (preference: TThemePreference) => void;
  toggleTheme: () => void;
}

export const IThemeStore = createInjectDecorator<IThemeStore>("IThemeStore");

export type IThemeStore = IThemeContext;
