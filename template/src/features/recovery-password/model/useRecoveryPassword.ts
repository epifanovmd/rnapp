import { zodResolver } from "@hookform/resolvers/zod";
import { IApiService } from "@shared/api";
import { useNavigation } from "@shared/lib/navigation";
import { useNotifications } from "@shared/lib/notifications";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import {
  recoveryPasswordValidationSchema,
  TRecoveryPasswordForm,
} from "./validation";

export const useRecoveryPassword = () => {
  const api = IApiService.useInstance();
  const navigation = useNavigation();
  const notifications = useNotifications();

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
        notifications.error(res.error.message);
      } else if (res.data) {
        if (res.data.message) {
          notifications.success(res.data.message);
        }
        navigation.navigate("SignIn");
      }
    })();
  }, [form, api, notifications, navigation]);

  return { form, handleSubmit };
};
