import type {
  TTabBarFit,
  TTabBarIndicator,
  TTabBarIndicatorAnimation,
  TTabBarLabels,
  TTabBarSurface,
  TTabBarVariant,
} from "@shared/ui";

export interface ITabBarDemoOptions {
  variant: TTabBarVariant;
  labels: TTabBarLabels;
  indicator: TTabBarIndicator;
  indicatorAnimation: TTabBarIndicatorAnimation;
  surface: TTabBarSurface;
  fit: TTabBarFit | "auto";
  bounce: boolean;
  haptics: boolean;
  badges: boolean;
}

export const DEFAULT_TAB_BAR_DEMO: ITabBarDemoOptions = {
  variant: "floating",
  labels: "active",
  indicator: "pill",
  indicatorAnimation: "worm",
  surface: "blur",
  fit: "auto",
  bounce: true,
  haptics: true,
  badges: true,
};

export const TAB_BAR_DEMO_ITEMS = [
  { key: "home", title: "Главная", icon: "home" },
  { key: "search", title: "Поиск", icon: "search" },
  { key: "users", title: "Люди", icon: "users" },
  { key: "mail", title: "Почта", icon: "mail" },
  { key: "settings", title: "Настройки", icon: "settings" },
] as const;

/** Бейджи демо: счётчик почты и точка у людей. */
export const TAB_BAR_DEMO_BADGES: Record<string, number | boolean> = {
  mail: 3,
  users: true,
};
