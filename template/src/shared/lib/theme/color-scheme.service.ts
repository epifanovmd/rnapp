import { injectable } from "inversify";
import { Appearance, AppState } from "react-native";

import { IColorSchemeProvider } from "./color-scheme.types";
import { TThemeName } from "./types";

@injectable()
export class ColorSchemeService implements IColorSchemeProvider {
  getPreferredScheme(): TThemeName {
    // null (схема неизвестна) трактуется как Light
    return Appearance.getColorScheme() === "dark" ? "Dark" : "Light";
  }

  onSchemeChange(callback: (scheme: TThemeName) => void): () => void {
    // iOS шлёт ложные смены схемы при уходе приложения в фон — события вне
    // active игнорируются, актуальная схема перечитывается при возврате.
    const appearanceSub = Appearance.addChangeListener(() => {
      if (AppState.currentState === "active") {
        callback(this.getPreferredScheme());
      }
    });

    const appStateSub = AppState.addEventListener("change", state => {
      if (state === "active") {
        callback(this.getPreferredScheme());
      }
    });

    return () => {
      appearanceSub.remove();
      appStateSub.remove();
    };
  }
}
