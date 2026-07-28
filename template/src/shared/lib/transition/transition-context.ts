import { createContext } from "react";

import { ITransitionContext } from "./transition.types";

export const TransitionContext = createContext<ITransitionContext | undefined>(
  undefined,
);
