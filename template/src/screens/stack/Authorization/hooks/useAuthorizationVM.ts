import { useTextInput } from "@force-dev/react";
import { useSessionDataStore } from "@store";
import { useCallback } from "react";

export const useAuthorizationVM = () => {
  const username = useTextInput({ initialValue: "emilys" });
  const password = useTextInput({ initialValue: "emilyspass" });

  const sessionDataStore = useSessionDataStore();

  const onLogin = useCallback(async () => {
    if (username.value && password.value)
      await sessionDataStore.signIn({
        username: username.value,
        password: password.value,
      });
  }, [password.value, sessionDataStore, username.value]);

  return {
    isLoading: sessionDataStore.isLoading,
    onLogin,
    username,
    password,
  };
};
