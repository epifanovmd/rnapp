import { useNavigation } from "@core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSessionDataStore } from "@store";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { signInFormValidationSchema, TSignInForm } from "../validations";

export const useSignInVM = () => {
  const sessionDataStore = useSessionDataStore();
  const navigation = useNavigation();

  const form = useForm<TSignInForm>({
    defaultValues: {
      login: "epifanovmd@gmail.com",
      password: "Epifan123",
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
      await sessionDataStore.signIn(data);
    })();
  }, [form, sessionDataStore]);

  return {
    form,
    handleLogin,
    handleNavigateRecoveryPassword,
    handleNavigateSignUp,
  };
};
