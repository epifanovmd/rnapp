import { IAuthStore } from "@entities/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { GITHUB_CLIENT_ID, GITHUB_REDIRECT_URI } from "@shared/config/env";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Linking } from "react-native";

import { signInFormValidationSchema, TSignInForm } from "./validation";

export const useSignInVM = () => {
  const authStore = IAuthStore.useInstance();

  const form = useForm<TSignInForm>({
    defaultValues: {
      login: "",
      password: "",
    },
    resolver: zodResolver(signInFormValidationSchema),
  });

  const handleLogin = useCallback(async () => {
    return form.handleSubmit(async data => {
      await authStore.signIn(data);
    })();
  }, [form, authStore]);

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
