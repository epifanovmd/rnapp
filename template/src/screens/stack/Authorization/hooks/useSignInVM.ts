import { AuthenticatePayload } from "@api/api-gen/data-contracts";
import { useNavigation } from "@core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSessionDataStore } from "@store";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Linking } from "react-native";

import { signInFormValidationSchema, TSignInForm } from "../validations";

export const useSignInVM = ({ code }: Partial<AuthenticatePayload>) => {
  const [processingAuth, setProcessingAuth] = useState<boolean>(false);

  const sessionDataStore = useSessionDataStore();
  const navigation = useNavigation();

  const form = useForm<TSignInForm>({
    defaultValues: {
      login: "epifanovmd@gmail.com",
      password: "Epifan123",
    },
    resolver: zodResolver(signInFormValidationSchema),
  });

  useEffect(() => {
    if (code) {
      setProcessingAuth(true);
      sessionDataStore
        .auth({ code })
        .catch(() => null)
        .finally(() => setProcessingAuth(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleNavigateSignUp = useCallback(() => {
    return navigation.navigate("SignUp");
  }, [navigation]);

  const handleNavigateRecoveryPassword = useCallback(() => {
    return navigation.navigate("RecoveryPassword");
  }, [navigation]);

  const handleLogin = useCallback(async () => {
    return form.handleSubmit(async data => {
      await sessionDataStore.signIn(data);
    })();
  }, [form, sessionDataStore]);

  const getAuthUrl = useCallback((): string => {
    const baseUrl = "https://github.com/login/oauth/authorize";
    const params = new URLSearchParams({
      client_id: "Ov23lizh9Zepze4yliRV",
      redirect_uri: "rnapp://SignIn",
      scope: "user:email",
    });

    return `${baseUrl}?${params.toString()}`;
  }, []);

  // Открытие браузера для авторизации
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
    processingAuth,
    loginByGithub,
    handleLogin,
    handleNavigateRecoveryPassword,
    handleNavigateSignUp,
  };
};
