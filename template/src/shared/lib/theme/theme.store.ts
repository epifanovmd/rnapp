import { injectable } from "inversify";
import { makeAutoObservable, observable } from "mobx";

import { IStorageService } from "../storage";
import { IColorSchemeProvider } from "./color-scheme.types";
import { IThemeStore } from "./theme.types";
import { ITheme, TColorTheme, TThemeName } from "./types";
import { DARK_THEME, DEFAULT_LIGHT_THEME } from "./variants";

const THEME_STORAGE_KEY = "themeName";

const THEMES: { [key in TThemeName]: ITheme } = {
  Dark: DARK_THEME,
  Light: DEFAULT_LIGHT_THEME,
};

const isThemeName = (value: string | null): value is TThemeName =>
  value === "Light" || value === "Dark";

@injectable()
export class ThemeStore implements IThemeStore {
  private _theme: ITheme;

  constructor(
    @IStorageService() private _storage: IStorageService,
    @IColorSchemeProvider() private _colorScheme: IColorSchemeProvider,
  ) {
    const saved = this._storage.getItem(THEME_STORAGE_KEY);
    const name = isThemeName(saved)
      ? saved
      : this._colorScheme.getPreferredScheme();

    this._theme = THEMES[name];

    if (!isThemeName(saved)) {
      this._storage.setItem(THEME_STORAGE_KEY, name);
    }

    makeAutoObservable<this, "_theme">(
      this,
      { _theme: observable.ref },
      { autoBind: true },
    );
  }

  get name(): TThemeName {
    return this._theme.name;
  }

  get colors(): TColorTheme {
    return this._theme.colors;
  }

  get isDark(): boolean {
    return this._theme.name === "Dark";
  }

  get isLight(): boolean {
    return this._theme.name === "Light";
  }

  setTheme(name: TThemeName): void {
    this._theme = THEMES[name];
    this._storage.setItem(THEME_STORAGE_KEY, name);
  }

  toggleTheme(): void {
    this.setTheme(this._theme.name === "Dark" ? "Light" : "Dark");
  }
}
