import { useTextInput } from "@force-dev/react";
import { useCallback } from "react";

import { useProfileDataStore } from "~@store";

import { useNavigationService } from "../../../../navigation";

export const useAuthorizationVM = () => {
  const username = useTextInput({ initialValue: "emilys" });
  const password = useTextInput({ initialValue: "emilyspass" });

  const profileDataStore = useProfileDataStore();
  const nav = useNavigationService();

  const onLogin = useCallback(async () => {
    if (username.value && password.value)
      await profileDataStore.signIn({
        username: username.value,
        password: password.value,
      });

    if (profileDataStore.profile) {
      nav.navigateTo("MAIN");
    }
  }, [nav, password.value, profileDataStore, username.value]);

  return {
    isLoading: profileDataStore.isLoading,
    onLogin,
    username,
    password,
  };
};
