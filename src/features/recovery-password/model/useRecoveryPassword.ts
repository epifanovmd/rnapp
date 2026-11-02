import { IMainApi } from "@shared/api";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { useZodForm } from "@shared/ui";
import { useCallback, useState } from "react";

import {
  recoveryPasswordValidationSchema,
  TRecoveryPasswordSubmit,
} from "./validation";

/** VM запроса письма для сброса пароля; после успеха — состояние «письмо отправлено». */
export const useRecoveryPassword = () => {
  const api = IMainApi.useInstance();
  const notifications = useNotifications();
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const form = useZodForm(recoveryPasswordValidationSchema, {
    defaultValues: {
      login: "",
    },
  });

  const handleSubmit = useCallback(
    async (data: TRecoveryPasswordSubmit) => {
      const res = await api.requestResetPassword(data);

      if (res.error) {
        notifyApiError(notifications, res.error);
      } else if (res.data) {
        setSentMessage(res.data.message ?? "");
      }
    },
    [api, notifications],
  );

  return { form, handleSubmit, isSent: sentMessage !== null, sentMessage };
};
