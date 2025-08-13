import { FC, PropsWithChildren } from "react";

import { useTransitionContext } from "./hooks";
import { TransitionContext } from "./Transition.context";
import { ITransitionContext } from "./Transition.types";

export const TransitionProvider: FC<
  PropsWithChildren<{ context?: ITransitionContext }>
> = ({ children, context: propsContext }) => {
  const context = useTransitionContext();

  return (
    <TransitionContext.Provider value={propsContext ?? context}>
      {children}
    </TransitionContext.Provider>
  );
};
