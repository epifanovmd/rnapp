import { ContainerModule } from "inversify";

import { ColorSchemeService } from "./color-scheme.service";
import { IColorSchemeProvider } from "./color-scheme.types";
import { ThemeStore } from "./theme.store";
import { IThemeStore } from "./theme.types";

export const themeModule = new ContainerModule(({ bind }) => {
  bind(IColorSchemeProvider.Tid).to(ColorSchemeService).inSingletonScope();
  bind(IThemeStore.Tid).to(ThemeStore).inSingletonScope();
});
