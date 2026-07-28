import { observer } from "mobx-react-lite";
import React, { PropsWithChildren, useMemo } from "react";
import { StatusBar } from "react-native";

import { IThemeStore } from "./theme.types";
import { ThemeContext } from "./theme-context";
import { IThemeContext } from "./types";

export const ThemeProvider = observer<PropsWithChildren>(({ children }) => {
  const store = IThemeStore.useInstance();

  const value = useMemo<IThemeContext>(
    () => ({
      name: store.name,
      colors: store.colors,
      isLight: store.isLight,
      isDark: store.isDark,
      setTheme: store.setTheme,
      toggleTheme: store.toggleTheme,
    }),
    [
      store.name,
      store.colors,
      store.isLight,
      store.isDark,
      store.setTheme,
      store.toggleTheme,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar barStyle={value.isDark ? "light-content" : "dark-content"} />
      {children}
    </ThemeContext.Provider>
  );
});
