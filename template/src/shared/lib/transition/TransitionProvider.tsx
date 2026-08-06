import React, { FC, PropsWithChildren, useMemo } from "react";

import { useBarHandle } from "./hooks/use-bar-handle";
import { ITransitionContext } from "./transition.types";
import { TransitionContext } from "./transition-context";

/**
 * Создаёт и предоставляет бары приложения (navbar, tabbar).
 * Экраны привязывают их к своему скроллу через useBarsScrollSync(telemetry).
 */
export const TransitionProvider: FC<PropsWithChildren> = ({ children }) => {
  const navbar = useBarHandle();
  const tabBar = useBarHandle();

  const value = useMemo<ITransitionContext>(
    () => ({ navbar, tabBar }),
    [navbar, tabBar],
  );

  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  );
};
