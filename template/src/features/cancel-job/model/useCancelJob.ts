import { IJobStore } from "@entities/job";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { useCallback } from "react";

/** Отмена задачи; ошибка — уведомлением. Возвращает, принята ли отмена. */
export const useCancelJob = () => {
  const jobStore = IJobStore.useInstance();
  const notifications = useNotifications();

  return useCallback(
    async (id: string): Promise<boolean> => {
      const res = await jobStore.cancel(id);

      if (res.error) {
        notifyApiError(notifications, res.error);

        return false;
      }

      return true;
    },
    [jobStore, notifications],
  );
};
