import React from "react";

import { IThemeContext } from "./types";
import { DEFAULT_LIGHT_THEME } from "./variants";

export const ThemeContext = React.createContext<IThemeContext>({
  name: "Light",
  colors: DEFAULT_LIGHT_THEME["colors"],
  toggleTheme: () => {
    console.error("ThemeProvider is not rendered!");
  },
  isLight: true,
  isDark: false,
});
