import { IAuthStore } from "@entities/auth";
import { notifyApiError } from "@shared/lib/http";
import { INotificationService } from "@shared/lib/notifications";
import { useZodForm } from "@shared/ui";
import { useCallback } from "react";

import { toSignUpRequest } from "./sign-up-request";
import { signUpFormValidationSchema, TSignUpSubmit } from "./validation";

/** VM регистрации по email или телефону. */
export const useSignUpVM = () => {
  const authStore = IAuthStore.useInstance();
  const notifications = INotificationService.useInstance();

  const form = useZodForm(signUpFormValidationSchema, {
    defaultValues: {
      firstName: "",
      lastName: "",
      login: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSignUp = useCallback(
    async (data: TSignUpSubmit) => {
      const params = toSignUpRequest(data);

      if (!params) return;

      notifyApiError(notifications, await authStore.signUp(params));
    },
    [authStore, notifications],
  );

  return {
    form,
    handleSignUp,
    isLoading: authStore.isLoading,
  };
};
