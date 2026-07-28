import { FC, PropsWithChildren } from "react";

import { useTransitionContext } from "./hooks/index";
import { ITransitionContext } from "./transition.types";
import { TransitionContext } from "./transition-context";

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
