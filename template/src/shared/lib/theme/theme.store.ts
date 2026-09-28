import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

import { IStorageService } from "../storage";
import { IColorSchemeProvider } from "./color-scheme.types";
import { ITheme, IThemeStore, TThemeName, TThemePreference } from "./types";
import { DARK_THEME, DEFAULT_LIGHT_THEME } from "./variants";

const THEME_STORAGE_KEY = "themeName";

const THEMES: { [key in TThemeName]: ITheme } = {
  Dark: DARK_THEME,
  Light: DEFAULT_LIGHT_THEME,
};

const isThemePreference = (value: string | null): value is TThemePreference =>
  value === "Light" || value === "Dark" || value === "System";

@injectable()
export class ThemeStore implements IThemeStore {
  private _preference: TThemePreference;
  private _systemScheme: TThemeName;

  constructor(
    @IStorageService() private _storage: IStorageService,
    @IColorSchemeProvider() private _colorScheme: IColorSchemeProvider,
  ) {
    const saved = this._storage.getItem(THEME_STORAGE_KEY);

    this._preference = isThemePreference(saved) ? saved : "System";
    this._systemScheme = this._colorScheme.getPreferredScheme();

    makeAutoObservable(this, {}, { autoBind: true });

    this._colorScheme.onSchemeChange(this._onSystemSchemeChange);
  }

  get preference(): TThemePreference {
    return this._preference;
  }

  get name(): TThemeName {
    return this._preference === "System"
      ? this._systemScheme
      : this._preference;
  }

  get colors() {
    return THEMES[this.name].colors;
  }

  get isDark(): boolean {
    return this.name === "Dark";
  }

  get isLight(): boolean {
    return this.name === "Light";
  }

  setTheme(preference: TThemePreference): void {
    this._preference = preference;
    this._storage.setItem(THEME_STORAGE_KEY, preference);
  }

  toggleTheme(): void {
    this.setTheme(this.isDark ? "Light" : "Dark");
  }

  private _onSystemSchemeChange(scheme: TThemeName): void {
    this._systemScheme = scheme;
  }
}
