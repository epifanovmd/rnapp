import { useTextInput } from "@force-dev/react";
import { useCallback } from "react";

import { useProfileDataStore, useSessionDataStore } from "~@store";

import { useNavigationService } from "../../../../navigation";

export const useAuthorizationVM = () => {
  const username = useTextInput({ initialValue: "emilys" });
  const password = useTextInput({ initialValue: "emilyspass" });

  const sessionDataStore = useSessionDataStore();
  const nav = useNavigationService();

  const onLogin = useCallback(async () => {
    if (username.value && password.value)
      await sessionDataStore.signIn({
        username: username.value,
        password: password.value,
      });

    if (sessionDataStore.isAuthorized) {
      nav.navigateTo("MAIN");
    }
  }, [nav, password.value, sessionDataStore, username.value]);

  return {
    isLoading: sessionDataStore.isLoading,
    onLogin,
    username,
    password,
  };
};
