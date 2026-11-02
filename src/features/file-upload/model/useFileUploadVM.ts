import { IFileStore } from "@entities/file";
import { notifyApiError } from "@shared/lib/http";
import { MediaPickerError } from "@shared/lib/media-picker";
import { useNotifications } from "@shared/lib/notifications";
import { pluralize } from "@shared/lib/utils";
import { useBottomSheetRef } from "@shared/ui";
import { useCallback } from "react";

import { FILE_SOURCES, TFileSourceKey } from "./file-sources";

const FILES_WORD = { one: "файл", few: "файла", many: "файлов" };

/** Загрузка в «Мои файлы»: шторка источников → выбор → очередь загрузки. */
export const useFileUploadVM = () => {
  const fileStore = IFileStore.useInstance();
  const notifications = useNotifications();
  const sheetRef = useBottomSheetRef();

  const open = useCallback(() => sheetRef.current?.present(), [sheetRef]);

  const selectSource = useCallback(
    async (key: TFileSourceKey) => {
      const source = FILE_SOURCES.find(item => item.key === key);

      if (!source) return;

      let files;

      try {
        files = await source.pick();
      } catch (e) {
        notifications.error(
          e instanceof MediaPickerError
            ? e.message
            : "Не удалось получить файл.",
        );

        return;
      }

      if (!files.length) return;

      const { uploaded, errors } = await fileStore.uploadMany(files);

      if (uploaded.length) {
        notifications.success(
          `Загружено: ${pluralize(uploaded.length, FILES_WORD, true)}`,
        );
      }
      if (errors.length === 1) notifyApiError(notifications, errors[0]);
      if (errors.length > 1) {
        notifications.error(
          `Не загружено: ${pluralize(errors.length, FILES_WORD, true)}`,
        );
      }
    },
    [fileStore, notifications],
  );

  return {
    sheetRef,
    sources: FILE_SOURCES,
    open,
    selectSource,
    isUploading: fileStore.isUploading,
    uploadProgress: fileStore.uploadProgress,
    uploadQueue: fileStore.uploadQueue,
  };
};
