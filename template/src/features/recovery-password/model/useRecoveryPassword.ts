import { zodResolver } from "@hookform/resolvers/zod";
import { IApiService } from "@shared/api";
import { useNavigation } from "@shared/lib/navigation";
import { useNotificationActions as useNotification } from "@shared/lib/notifications";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import {
  recoveryPasswordValidationSchema,
  TRecoveryPasswordForm,
} from "./validation";

export const useRecoveryPassword = () => {
  const api = IApiService.useInstance();
  const navigation = useNavigation();
  const { show } = useNotification();

  const form = useForm<TRecoveryPasswordForm>({
    defaultValues: {
      login: "",
    },
    resolver: zodResolver(recoveryPasswordValidationSchema),
  });

  const handleSubmit = useCallback(() => {
    return form.handleSubmit(async data => {
      const res = await api.requestResetPassword(data);

      if (res.error) {
        show(res.error.message, { type: "danger" });
      } else if (res.data) {
        if (res.data.message) {
          show(res.data.message, { type: "success" });
        }
        navigation.navigate("SignIn");
      }
    })();
  }, [form, api, show, navigation]);

  return { form, handleSubmit };
};
