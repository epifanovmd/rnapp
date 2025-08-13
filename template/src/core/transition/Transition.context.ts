import { createContext } from "react";

import { ITransitionContext } from "./Transition.types";

export const TransitionContext = createContext<ITransitionContext | undefined>(
  undefined,
);
