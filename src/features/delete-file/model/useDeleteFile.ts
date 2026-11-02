import { IFileStore } from "@entities/file";
import type { IFileDto } from "@shared/api/gen/main/model";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { useConfirm } from "@shared/ui";
import { useCallback } from "react";

/** Удаление файла с подтверждением; ошибка — уведомлением. Возвращает, удалён ли. */
export const useDeleteFile = () => {
  const fileStore = IFileStore.useInstance();
  const notifications = useNotifications();
  const confirm = useConfirm();

  return useCallback(
    async (file: IFileDto): Promise<boolean> => {
      const ok = await confirm({
        title: "Удалить файл?",
        description: file.name,
        confirmLabel: "Удалить",
        confirmVariant: "destructive",
      });

      if (!ok) return false;

      const res = await fileStore.remove(file.id);

      if (res.error) {
        notifyApiError(notifications, res.error);

        return false;
      }

      return true;
    },
    [confirm, fileStore, notifications],
  );
};
