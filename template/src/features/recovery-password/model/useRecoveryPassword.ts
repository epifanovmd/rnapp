import { IApiService } from "@shared/api";
import { useNotifications } from "@shared/lib/notifications";
import { useZodForm } from "@shared/ui";
import { useCallback } from "react";

import {
  recoveryPasswordValidationSchema,
  TRecoveryPasswordSubmit,
} from "./validation";

export const useRecoveryPassword = (onSuccess: () => void) => {
  const api = IApiService.useInstance();
  const notifications = useNotifications();

  const form = useZodForm(recoveryPasswordValidationSchema, {
    defaultValues: {
      login: "",
    },
  });

  const handleSubmit = useCallback(
    async (data: TRecoveryPasswordSubmit) => {
      const res = await api.requestResetPassword(data);

      if (res.error) {
        notifications.error(res.error.message);
      } else if (res.data) {
        if (res.data.message) {
          notifications.success(res.data.message);
        }
        onSuccess();
      }
    },
    [api, notifications, onSuccess],
  );

  return { form, handleSubmit };
};
