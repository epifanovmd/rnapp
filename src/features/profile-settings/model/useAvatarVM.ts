import { IFileStore } from "@entities/file";
import { IUserStore } from "@entities/user";
import { notifyApiError } from "@shared/lib/http";
import { MediaPickerError } from "@shared/lib/media-picker";
import { useNotifications } from "@shared/lib/notifications";
import { useBottomSheetRef } from "@shared/ui";
import { useCallback, useEffect, useState } from "react";

import { AVATAR_SOURCES, TAvatarSourceKey } from "./avatar-sources";

/**
 * Аватар — id своего загруженного изображения: новое фото из галереи или
 * камеры (шторка источников), либо одно из уже загруженных.
 */
export const useAvatarVM = () => {
  const userStore = IUserStore.useInstance();
  const fileStore = IFileStore.useInstance();
  const notifications = useNotifications();
  const [isBusy, setBusy] = useState(false);
  const sheetRef = useBottomSheetRef();

  useEffect(() => {
    if (fileStore.filesHolder.isIdle) fileStore.load();
  }, [fileStore]);

  const setAvatar = useCallback(
    async (avatarId: string | null) => {
      setBusy(true);
      const res = await userStore.updateProfile({ avatarId });

      setBusy(false);

      if (res.error) {
        notifyApiError(notifications, res.error);
      }
    },
    [notifications, userStore],
  );

  const uploadFrom = useCallback(
    async (key: TAvatarSourceKey) => {
      const source = AVATAR_SOURCES.find(item => item.key === key);

      if (!source) return;

      let photo;

      try {
        [photo] = await source.pick();
      } catch (e) {
        notifications.error(
          e instanceof MediaPickerError
            ? e.message
            : "Не удалось получить изображение.",
        );

        return;
      }

      if (!photo) return;

      setBusy(true);

      const uploaded = await fileStore.upload(photo);

      setBusy(false);

      if (uploaded.error) {
        notifyApiError(notifications, uploaded.error);

        return;
      }

      await setAvatar(uploaded.data.id);
    },
    [fileStore, notifications, setAvatar],
  );

  const model = userStore.model;

  return {
    avatarUrl: model?.avatarUrl,
    avatarId: model?.avatarId,
    displayName: model?.displayName ?? "",
    images: fileStore.images,
    isBusy,
    sheetRef,
    sources: AVATAR_SOURCES,
    openSources: () => sheetRef.current?.present(),
    uploadFrom,
    selectImage: setAvatar,
    removeAvatar: () => setAvatar(null),
  };
};
