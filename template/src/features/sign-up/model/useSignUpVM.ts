import { IAuthStore } from "@entities/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@shared/lib/navigation";
import { isEmail, isPhone } from "@shared/lib/utils";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { signUpFormValidationSchema, TSignUpForm } from "./validation";

export const useSignUpVM = () => {
  const authStore = IAuthStore.useInstance();
  const navigation = useNavigation();

  const form = useForm<TSignUpForm>({
    defaultValues: {},
    resolver: zodResolver(signUpFormValidationSchema),
  });

  const handleSignUp = useCallback(async () => {
    return form.handleSubmit(async data => {
      const email = isEmail(data.login) ? data.login : undefined;
      const phone = isPhone(data.login) ? data.login : undefined;

      if (email) {
        await authStore.signUp({ email, password: data.password });
      } else if (phone) {
        await authStore.signUp({ phone, password: data.password });
      }

      if (authStore.isAuthenticated) {
        navigation.navigate("Main");
      }
    })();
  }, [form, navigation, authStore]);

  return {
    form,
    handleSignUp,
  };
};
