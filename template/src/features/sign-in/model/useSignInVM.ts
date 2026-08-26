import { IAuthStore } from "@entities/auth";
import { GITHUB_CLIENT_ID, GITHUB_REDIRECT_URI } from "@shared/config/env";
import { useZodForm } from "@shared/ui";
import { useCallback } from "react";
import { Linking } from "react-native";

import { signInFormValidationSchema, TSignInSubmit } from "./validation";

export const useSignInVM = () => {
  const authStore = IAuthStore.useInstance();

  const form = useZodForm(signInFormValidationSchema, {
    defaultValues: {
      login: "epifanovmd@gmail.com",
      password: "Epifan123",
    },
  });

  const handleLogin = useCallback(
    async (data: TSignInSubmit) => authStore.signIn(data),
    [authStore],
  );

  const handleVerify2FA = useCallback(
    async (password: string) => {
      await authStore.verify2FA(password);
    },
    [authStore],
  );

  const getAuthUrl = useCallback((): string => {
    const baseUrl = "https://github.com/login/oauth/authorize";
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_REDIRECT_URI,
      scope: "user:email",
    });

    return `${baseUrl}?${params.toString()}`;
  }, []);

  const loginByGithub = useCallback(async (): Promise<void> => {
    try {
      const authUrl = getAuthUrl();

      await Linking.openURL(authUrl);
    } catch (err: any) {
      console.error("GitHub OAuth error:", err);
    }
  }, [getAuthUrl]);

  return {
    form,
    loginByGithub,
    handleLogin,
    isTwoFactorRequired: authStore.isTwoFactorRequired,
    twoFactorHint: authStore.twoFactorHint,
    error: authStore.error,
    handleVerify2FA,
  };
};
