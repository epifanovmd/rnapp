import { useContext } from "react";

import { ITransitionContext } from "../transition.types";
import { TransitionContext } from "../transition-context";
import { useTransitionContext } from "./use-transition-context";

export const useTransition = (): ITransitionContext => {
  const context = useContext(TransitionContext);

  const localContext = useTransitionContext();

  return context ?? localContext;
};
