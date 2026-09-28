import { IAuthStore } from "@entities/auth";
import { IUserStore } from "@entities/user";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { useZodForm } from "@shared/ui";
import { useCallback } from "react";
import { Alert } from "react-native";

import { deleteAccountSchema, TDeleteAccountForm } from "./validation";

const confirmDeletion = () =>
  new Promise<boolean>(resolve =>
    Alert.alert(
      "Удалить аккаунт?",
      "Аккаунт и данные будут удалены без возможности восстановления.",
      [
        { text: "Отмена", style: "cancel", onPress: () => resolve(false) },
        { text: "Удалить", style: "destructive", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );

/** Удаление своего аккаунта по текущему паролю с подтверждением. */
export const useDeleteAccountVM = () => {
  const userStore = IUserStore.useInstance();
  const authStore = IAuthStore.useInstance();
  const notifications = useNotifications();

  const form = useZodForm(deleteAccountSchema, {
    defaultValues: { password: "" },
  });

  const handleSubmit = useCallback(
    async ({ password }: TDeleteAccountForm) => {
      if (!(await confirmDeletion())) return;

      const res = await userStore.deleteMyAccount(password);

      if (res.error) {
        notifyApiError(notifications, res.error);

        return;
      }

      notifications.success("Аккаунт удалён.");
      authStore.signOut();
    },
    [authStore, notifications, userStore],
  );

  return { form, handleSubmit };
};
