import { injectable } from "inversify";
import { Appearance } from "react-native";

import { IColorSchemeProvider } from "./color-scheme.types";
import { TThemeName } from "./types";

@injectable()
export class ColorSchemeService implements IColorSchemeProvider {
  getPreferredScheme(): TThemeName {
    return Appearance.getColorScheme() === "dark" ? "Dark" : "Light";
  }

  onSchemeChange(callback: (scheme: TThemeName) => void): () => void {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      callback(colorScheme === "dark" ? "Dark" : "Light");
    });

    return () => sub.remove();
  }
}
