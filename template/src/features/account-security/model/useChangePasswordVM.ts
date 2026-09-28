import { IUserStore } from "@entities/user";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { useZodForm } from "@shared/ui";
import { useCallback } from "react";

import { changePasswordSchema, TChangePasswordSubmit } from "./validation";

/** Смена пароля: текущий + новый с подтверждением. */
export const useChangePasswordVM = () => {
  const userStore = IUserStore.useInstance();
  const notifications = useNotifications();

  const form = useZodForm(changePasswordSchema, {
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = useCallback(
    async (data: TChangePasswordSubmit) => {
      const res = await userStore.changePassword(
        data.currentPassword,
        data.newPassword,
      );

      if (res.error) {
        notifyApiError(notifications, res.error);

        return;
      }

      form.reset();
      notifications.success("Пароль изменён, другие сессии завершены.");
    },
    [form, notifications, userStore],
  );

  return { form, handleSubmit };
};
