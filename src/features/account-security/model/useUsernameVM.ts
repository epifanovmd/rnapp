import { IUserStore } from "@entities/user";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { useZodForm } from "@shared/ui";
import { useCallback } from "react";

import { TUsernameForm, usernameSchema } from "./validation";

/** Установка username текущего пользователя. */
export const useUsernameVM = () => {
  const userStore = IUserStore.useInstance();
  const notifications = useNotifications();

  const form = useZodForm(usernameSchema, {
    values: { username: userStore.user?.username ?? "" },
  });

  const handleSubmit = useCallback(
    async ({ username }: TUsernameForm) => {
      const res = await userStore.setUsername(username);

      if (res.error) {
        notifyApiError(notifications, res.error);

        return;
      }

      notifications.success("Username сохранён.");
    },
    [notifications, userStore],
  );

  return { form, handleSubmit };
};
