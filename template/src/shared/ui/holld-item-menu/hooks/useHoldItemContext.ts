import { useContext } from "react";

import { HoldItemContext } from "../hold-item-context";

export const useHoldItemContext = () => {
  const context = useContext(HoldItemContext);

  if (!context) {
    throw new Error("HoldItemContext is not provided");
  }

  return context;
};
