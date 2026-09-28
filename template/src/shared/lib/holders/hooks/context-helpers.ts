import { useContext } from "react";

export const useCtx = <T>(ctx: React.Context<T | null>, name: string): T => {
  const value = useContext(ctx);

  if (!value)
    throw new Error(`use${name}Context must be used within ${name}Provider`);

  return value;
};
