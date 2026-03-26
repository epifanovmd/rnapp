import { useNavigation } from "@core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@store";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Linking } from "react-native";

import { signInFormValidationSchema, TSignInForm } from "../validations";

export const useSignInVM = () => {
  const authStore = useAuthStore();
  const navigation = useNavigation();

  const form = useForm<TSignInForm>({
    defaultValues: {
      login: "user@example.com",
      password: "password123",
    },
    resolver: zodResolver(signInFormValidationSchema),
  });

  const handleNavigateSignUp = useCallback(() => {
    return navigation.navigate("SignUp");
  }, [navigation]);

  const handleNavigateRecoveryPassword = useCallback(() => {
    return navigation.navigate("RecoveryPassword");
  }, [navigation]);

  const handleLogin = useCallback(async () => {
    return form.handleSubmit(async data => {
      await authStore.signIn(data);
    })();
  }, [form, authStore]);

  const getAuthUrl = useCallback((): string => {
    const baseUrl = "https://github.com/login/oauth/authorize";
    const params = new URLSearchParams({
      client_id: "Ov23lizh9Zepze4yliRV",
      redirect_uri: "rnapp://SignIn",
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
    handleNavigateRecoveryPassword,
    handleNavigateSignUp,
  };
};
