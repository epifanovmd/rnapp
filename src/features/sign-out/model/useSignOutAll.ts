import { IAuthStore } from "@entities/auth";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { useCallback, useState } from "react";

/** Выход со всех устройств: сервер завершает все сессии, включая текущую. */
export const useSignOutAll = () => {
  const auth = IAuthStore.useInstance();
  const notifications = useNotifications();
  const [isLoading, setLoading] = useState(false);

  const signOutAll = useCallback(async () => {
    setLoading(true);
    const res = await auth.signOutAll();

    setLoading(false);

    if (res.error) {
      notifyApiError(notifications, res.error);
    }
  }, [auth, notifications]);

  return { signOutAll, isLoading };
};
