import { IUserStore } from "@entities/user";
import { EPrivacyLevel, PrivacySettingsDto } from "@shared/api/gen/main/model";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { useCallback, useEffect } from "react";

export const PRIVACY_FIELDS: {
  key: keyof PrivacySettingsDto;
  label: string;
}[] = [
  { key: "showAvatar", label: "Кто видит аватар" },
  { key: "showPhone", label: "Кто видит телефон" },
  { key: "showLastOnline", label: "Кто видит время в сети" },
];

export const PRIVACY_OPTIONS: { label: string; value: EPrivacyLevel }[] = [
  { label: "Все", value: EPrivacyLevel.everyone },
  { label: "Контакты", value: EPrivacyLevel.contacts },
  { label: "Никто", value: EPrivacyLevel.nobody },
];

/** Настройки приватности: каждое изменение сразу уходит на сервер. */
export const usePrivacyVM = () => {
  const userStore = IUserStore.useInstance();
  const notifications = useNotifications();

  useEffect(() => {
    userStore.loadPrivacy();
  }, [userStore]);

  const change = useCallback(
    async (key: keyof PrivacySettingsDto, value: EPrivacyLevel) => {
      const res = await userStore.updatePrivacy({ [key]: value });

      if (res.error) notifyApiError(notifications, res.error);
    },
    [notifications, userStore],
  );

  const error = userStore.privacy ? undefined : userStore.privacyError?.message;

  return {
    privacy: userStore.privacy,
    isLoading: !userStore.privacy && !error,
    /** Ошибка загрузки настроек (пока их нет). */
    error,
    retry: userStore.loadPrivacy,
    change,
  };
};
