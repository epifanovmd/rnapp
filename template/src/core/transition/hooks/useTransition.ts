import { useContext } from "react";

import { TransitionContext } from "../Transition.context";
import { ITransitionContext } from "../Transition.types";
import { useTransitionContext } from "./useTransitionContext";

export const useTransition = (): ITransitionContext => {
  const context = useContext(TransitionContext);

  const localContext = useTransitionContext();

  return context ?? localContext;
};
