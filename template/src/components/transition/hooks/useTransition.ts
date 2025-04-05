import { useContext } from "react";

import { TransitionContext } from "../Transition.context";
import { ITransitionContext } from "../Transition.types";
import { useTransitionCreateContext } from "./useTransitionCreateContext";

export const useTransition = (): ITransitionContext => {
  const context = useContext(TransitionContext);

  const localContext = useTransitionCreateContext();

  if (context) return context;

  return localContext;
};
