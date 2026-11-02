import { IUserStore } from "@entities/user";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { useZodForm } from "@shared/ui";
import { useCallback, useState } from "react";

import { codeSchema, emailSchema, TCodeForm, TEmailForm } from "./validation";

/**
 * Смена email в два шага: новый адрес → код из письма на него. Адрес
 * меняется только после подтверждения кодом.
 */
export const useChangeEmailVM = () => {
  const userStore = IUserStore.useInstance();
  const notifications = useNotifications();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const emailForm = useZodForm(emailSchema, {
    defaultValues: { email: "" },
  });
  const codeForm = useZodForm(codeSchema, { defaultValues: { code: "" } });

  const requestChange = useCallback(
    async ({ email }: TEmailForm) => {
      const res = await userStore.requestEmailChange(email);

      if (res.error) {
        notifyApiError(notifications, res.error);

        return;
      }

      setPendingEmail(email);
      notifications.info(`Код отправлен на ${email}.`);
    },
    [notifications, userStore],
  );

  const confirmChange = useCallback(
    async ({ code }: TCodeForm) => {
      const res = await userStore.confirmEmailChange(code);

      if (res.error) {
        notifyApiError(notifications, res.error);

        return;
      }

      setPendingEmail(null);
      emailForm.reset();
      codeForm.reset();
      notifications.success("Email изменён.");
    },
    [codeForm, emailForm, notifications, userStore],
  );

  const cancel = useCallback(() => {
    setPendingEmail(null);
    codeForm.reset();
  }, [codeForm]);

  return {
    currentEmail: userStore.user?.email ?? null,
    pendingEmail,
    emailForm,
    codeForm,
    requestChange,
    confirmChange,
    cancel,
  };
};
