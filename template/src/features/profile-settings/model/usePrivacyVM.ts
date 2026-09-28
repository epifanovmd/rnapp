import { IUserStore } from "@entities/user";
import { EPrivacyLevel, PrivacySettingsDto } from "@shared/api/gen/main/model";
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
      const updated = await userStore.updatePrivacy({ [key]: value });

      if (!updated) notifications.error("Не удалось сохранить настройку.");
    },
    [notifications, userStore],
  );

  return {
    privacy: userStore.privacy,
    isLoading: !userStore.privacy,
    change,
  };
};
