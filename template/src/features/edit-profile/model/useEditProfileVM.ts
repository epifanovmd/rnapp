import { IUserStore } from "@entities/user";
import { notifyApiError } from "@shared/lib/http";
import { useLeaveConfirmation } from "@shared/lib/navigation";
import { useNotifications } from "@shared/lib/notifications";
import { useZodForm } from "@shared/ui";

import { toProfileFormValues, toProfileUpdate } from "./profile-form-values";
import { profileFormValidationSchema, TProfileForm } from "./validation";

interface IUseEditProfileVMOptions {
  open: boolean;
  onSuccess: () => void;
}

/**
 * Редактирование профиля. Значения формы следуют за профилем стора (правки
 * пользователя при живом обновлении сохраняются); несохранённое
 * сбрасывается в `onClosed` — после анимации закрытия шторки.
 */
export const useEditProfileVM = ({
  open,
  onSuccess,
}: IUseEditProfileVMOptions) => {
  const userStore = IUserStore.useInstance();
  const notifications = useNotifications();

  const form = useZodForm(profileFormValidationSchema, {
    values: toProfileFormValues(userStore.user?.profile),
    resetOptions: { keepDirtyValues: true },
  });

  useLeaveConfirmation({
    when: open && form.formState.isDirty,
    dialog: { description: "Изменения профиля не сохранены и пропадут." },
  });

  const onClosed = () =>
    form.reset(toProfileFormValues(userStore.user?.profile));

  const submit = async (data: TProfileForm) => {
    const res = await userStore.updateProfile(toProfileUpdate(data));

    if (res.error) {
      notifyApiError(notifications, res.error);

      return;
    }

    notifications.success("Профиль сохранён.");
    onSuccess();
  };

  return { form, submit, onClosed };
};
