import type { TIconName } from "@shared/ui";

/** Stack-экраны, на которые ведут пункты меню. */
export type TAppMenuRoute = "Security" | "Audit" | "Files" | "Jobs";

export interface IAppMenuItem {
  route: TAppMenuRoute;
  label: string;
  icon: TIconName;
}

export interface IAppMenuGroup {
  label: string;
  items: IAppMenuItem[];
}

/** Группы навигационных пунктов меню; профиль — в шапке. */
export const APP_MENU_GROUPS: IAppMenuGroup[] = [
  {
    label: "Аккаунт",
    items: [
      { route: "Security", label: "Безопасность", icon: "shield" },
      { route: "Audit", label: "Журнал действий", icon: "scrollText" },
    ],
  },
  {
    label: "Данные",
    items: [
      { route: "Files", label: "Мои файлы", icon: "document" },
      { route: "Jobs", label: "Фоновые задачи", icon: "listChecks" },
    ],
  },
];
