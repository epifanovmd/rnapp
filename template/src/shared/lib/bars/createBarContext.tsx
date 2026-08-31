import React, {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { IBar } from "./bars.types";
import { createBar, IBarOptions } from "./create-bar";

/**
 * Провайдер и хук для одной панели. Каждая панель живёт в своём слое со своим
 * провайдером: экран подключает только те панели, которые у него есть.
 */
export const createBarContext = (name: string) => {
  const Context = createContext<IBar | null>(null);

  const Provider: FC<PropsWithChildren<IBarOptions>> = ({
    duration,
    children,
  }) => {
    const [bar] = useState(() => createBar({ duration }));

    return <Context.Provider value={bar}>{children}</Context.Provider>;
  };

  const useBar = (): IBar => {
    const bar = useContext(Context);

    if (!bar) {
      throw new Error(`${name} must be used within its provider`);
    }

    return bar;
  };

  return { Provider, useBar };
};
