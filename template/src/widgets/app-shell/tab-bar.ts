import { createBarContext, useBarHeight } from "@shared/lib/bars";

const { Provider, useBar } = createBarContext("useTabBar");

/** Нижняя таб-панель приложения */
export const TabBarProvider = Provider;

/** Таб-панель поддерева */
export const useTabBar = useBar;

/** Измеренная высота таб-панели — для нижнего отступа контента */
export const useTabBarHeight = (): number => useBarHeight(useTabBar());
