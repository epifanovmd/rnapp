import { IAuthStore } from "@entities/auth";
import { notifyApiError } from "@shared/lib/http";
import { INotificationService } from "@shared/lib/notifications";
import { isEmail, isPhone } from "@shared/lib/utils";
import { useZodForm } from "@shared/ui";
import { useCallback } from "react";

import { signUpFormValidationSchema, TSignUpSubmit } from "./validation";

export const useSignUpVM = () => {
  const authStore = IAuthStore.useInstance();
  const notifications = INotificationService.useInstance();

  const form = useZodForm(signUpFormValidationSchema, {
    defaultValues: {},
  });

  const handleSignUp = useCallback(
    async (data: TSignUpSubmit) => {
      const email = isEmail(data.login) ? data.login : undefined;
      const phone = isPhone(data.login) ? data.login : undefined;

      const params = email
        ? { email, password: data.password }
        : phone
          ? { phone, password: data.password }
          : null;

      if (!params) return;

      notifyApiError(notifications, await authStore.signUp(params));
    },
    [authStore, notifications],
  );

  return {
    form,
    handleSignUp,
  };
};
