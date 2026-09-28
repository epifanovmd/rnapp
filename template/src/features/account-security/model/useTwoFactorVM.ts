import { IAuthStore } from "@entities/auth";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { useZodForm } from "@shared/ui";
import { useCallback, useState } from "react";

import {
  disable2FASchema,
  enable2FASchema,
  TDisable2FAForm,
  TEnable2FASubmit,
} from "./validation";

export type TTwoFactorMode = "enable" | "disable";

/**
 * 2FA — второй пароль поверх основного. Статуса 2FA в профиле нет, поэтому
 * пользователь сам выбирает действие: включить или выключить.
 */
export const useTwoFactorVM = () => {
  const authStore = IAuthStore.useInstance();
  const notifications = useNotifications();
  const [mode, setMode] = useState<TTwoFactorMode>("enable");

  const enableForm = useZodForm(enable2FASchema, {
    defaultValues: { currentPassword: "", password: "", hint: "" },
  });
  const disableForm = useZodForm(disable2FASchema, {
    defaultValues: { currentPassword: "", password: "" },
  });

  const enable = useCallback(
    async ({ hint, ...data }: TEnable2FASubmit) => {
      const res = await authStore.enable2FA({
        ...data,
        hint: hint?.trim() || undefined,
      });

      if (res.error) {
        notifyApiError(notifications, res.error);

        return;
      }

      enableForm.reset();
      notifications.success("Двухфакторная аутентификация включена.");
    },
    [authStore, enableForm, notifications],
  );

  const disable = useCallback(
    async (data: TDisable2FAForm) => {
      const res = await authStore.disable2FA(data);

      if (res.error) {
        notifyApiError(notifications, res.error);

        return;
      }

      disableForm.reset();
      notifications.success("Двухфакторная аутентификация выключена.");
    },
    [authStore, disableForm, notifications],
  );

  return { mode, setMode, enableForm, disableForm, enable, disable };
};
