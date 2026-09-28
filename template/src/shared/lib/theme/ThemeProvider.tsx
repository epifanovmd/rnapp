import { observer } from "mobx-react-lite";
import React, { PropsWithChildren, useMemo } from "react";

import { ThemeContext } from "./theme-context";
import { IThemeContext, IThemeStore } from "./types";

export const ThemeProvider = observer<PropsWithChildren>(({ children }) => {
  const store = IThemeStore.useInstance();

  const value = useMemo<IThemeContext>(
    () => ({
      name: store.name,
      colors: store.colors,
      preference: store.preference,
      isLight: store.isLight,
      isDark: store.isDark,
      setTheme: store.setTheme,
      toggleTheme: store.toggleTheme,
    }),
    [
      store.name,
      store.colors,
      store.preference,
      store.isLight,
      store.isDark,
      store.setTheme,
      store.toggleTheme,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
});
