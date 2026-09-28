import { IUserStore } from "@entities/user";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { useZodForm } from "@shared/ui";
import { useCallback, useState } from "react";

import { codeSchema, TCodeForm } from "./validation";

/** Подтверждение текущего email кодом из письма. */
export const useVerifyEmailVM = () => {
  const userStore = IUserStore.useInstance();
  const notifications = useNotifications();
  const [isCodeSent, setCodeSent] = useState(false);
  const [isRequesting, setRequesting] = useState(false);

  const form = useZodForm(codeSchema, { defaultValues: { code: "" } });

  const requestCode = useCallback(async () => {
    setRequesting(true);
    const res = await userStore.requestVerifyEmail();

    setRequesting(false);

    if (res.error) {
      notifyApiError(notifications, res.error);

      return;
    }

    setCodeSent(true);
    notifications.info("Код подтверждения отправлен на email.");
  }, [notifications, userStore]);

  const verify = useCallback(
    async ({ code }: TCodeForm) => {
      const res = await userStore.verifyEmail(code);

      if (res.error) {
        notifyApiError(notifications, res.error);

        return;
      }

      form.reset();
      setCodeSent(false);
      notifications.success("Email подтверждён.");
    },
    [form, notifications, userStore],
  );

  const user = userStore.user;

  return {
    needsVerification: !!user?.email && !user.emailVerified,
    isCodeSent,
    isRequesting,
    form,
    requestCode,
    verify,
  };
};
