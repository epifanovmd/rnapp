import React from "react";

import { ITheme } from "../types";
import { useTheme } from "./useTheme";

type Generator<T extends {}> = (theme: ITheme) => T;

const useThemeAwareObject = <T extends {}>(fn: Generator<T>) => {
  const { theme } = useTheme();

  return React.useMemo(() => fn(theme), [fn, theme]);
};

export { useThemeAwareObject };
