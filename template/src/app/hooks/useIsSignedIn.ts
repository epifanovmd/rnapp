import { IAuthStore } from "@entities/auth";
import { reaction } from "mobx";
import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) =>
  reaction(() => IAuthStore.getInstance().isAuthenticated, onChange);

const getIsAuthenticated = () => IAuthStore.getInstance().isAuthenticated;

/** Guard-хуки для static-групп корневого стека (`if:` в RN7). */
export const useIsSignedIn = () =>
  useSyncExternalStore(subscribe, getIsAuthenticated);

export const useIsSignedOut = () => !useIsSignedIn();
