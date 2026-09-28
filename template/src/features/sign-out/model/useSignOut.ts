import { IAuthStore } from "@entities/auth";
import { useCallback } from "react";

export const useSignOut = () => {
  const auth = IAuthStore.useInstance();

  return useCallback(() => auth.signOut(), [auth]);
};
