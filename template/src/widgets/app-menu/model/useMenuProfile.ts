import { IUserStore } from "@entities/user";

export interface IMenuProfile {
  displayName: string;
  subtitle?: string;
  avatarUrl?: string;
}

/** Профиль для меню и его шапки (читать в observer-компоненте). */
export const useMenuProfile = (): IMenuProfile => {
  const { model } = IUserStore.useInstance();

  return {
    displayName: model?.displayName ?? "",
    subtitle: model?.login ?? undefined,
    avatarUrl: model?.avatarUrl,
  };
};
