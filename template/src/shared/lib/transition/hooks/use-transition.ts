import { useContext } from "react";

import { ITransitionContext } from "../transition.types";
import { TransitionContext } from "../transition-context";

/** Бары приложения из контекста; требует TransitionProvider выше по дереву. */
export const useTransition = (): ITransitionContext => {
  const context = useContext(TransitionContext);

  if (!context) {
    throw new Error("useTransition must be used within TransitionProvider");
  }

  return context;
};
