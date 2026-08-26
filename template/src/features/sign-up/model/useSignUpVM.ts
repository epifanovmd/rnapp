import { IAuthStore } from "@entities/auth";
import { isEmail, isPhone } from "@shared/lib/utils";
import { useZodForm } from "@shared/ui";
import { useCallback } from "react";

import { signUpFormValidationSchema, TSignUpSubmit } from "./validation";

export const useSignUpVM = () => {
  const authStore = IAuthStore.useInstance();

  const form = useZodForm(signUpFormValidationSchema, {
    defaultValues: {},
  });

  const handleSignUp = useCallback(
    async (data: TSignUpSubmit) => {
      const email = isEmail(data.login) ? data.login : undefined;
      const phone = isPhone(data.login) ? data.login : undefined;

      if (email) {
        await authStore.signUp({ email, password: data.password });
      } else if (phone) {
        await authStore.signUp({ phone, password: data.password });
      }
    },
    [authStore],
  );

  return {
    form,
    handleSignUp,
  };
};
