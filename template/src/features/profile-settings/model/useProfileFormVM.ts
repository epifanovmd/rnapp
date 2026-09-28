import { IUserStore } from "@entities/user";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { useZodForm } from "@shared/ui";
import { useCallback, useEffect } from "react";

import { profileSchema, toProfileUpdate, TProfileForm } from "./validation";

/** Редактирование профиля текущего пользователя. */
export const useProfileFormVM = () => {
  const userStore = IUserStore.useInstance();
  const notifications = useNotifications();
  const profile = userStore.user?.profile;

  // Пользователь грузится при входе; после сбоя сети или hot reload стор может
  // быть пуст — экран перечитывает его сам (есть данные — «тихо»).
  useEffect(() => {
    userStore.load();
  }, [userStore]);

  const form = useZodForm(profileSchema, {
    values: {
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      birthDate: profile?.birthDate?.slice(0, 10) ?? "",
      gender: profile?.gender ?? "",
      locale: profile?.locale ?? "",
    },
  });

  const handleSubmit = useCallback(
    async (data: TProfileForm) => {
      const res = await userStore.updateProfile(toProfileUpdate(data));

      if (res.error) {
        notifyApiError(notifications, res.error);

        return;
      }

      notifications.success("Профиль сохранён.");
    },
    [notifications, userStore],
  );

  return { form, handleSubmit };
};
