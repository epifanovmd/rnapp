import { FC, PropsWithChildren } from "react";

import { useTransitionCreateContext } from "./hooks";
import { TransitionContext } from "./Transition.context";
import { ITransitionContext } from "./Transition.types";

export const TransitionProvider: FC<
  PropsWithChildren<{ context?: ITransitionContext }>
> = ({ children, context: propsContext }) => {
  const context = useTransitionCreateContext();

  return (
    <TransitionContext.Provider value={propsContext ?? context}>
      {children}
    </TransitionContext.Provider>
  );
};
