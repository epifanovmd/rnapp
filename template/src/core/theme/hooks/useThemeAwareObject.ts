import React from "react";

import { ITheme } from "../types";
import { useTheme } from "./useTheme";

type Generator<T extends {}> = (theme: ITheme) => T;

const useThemeAwareObject = <T extends {}>(fn: Generator<T>) => {
  const { name, colors } = useTheme();

  return React.useMemo(() => fn({ name, colors }), [fn, name, colors]);
};

export { useThemeAwareObject };
