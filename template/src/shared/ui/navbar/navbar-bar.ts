import { createBarContext, useBarHeight } from "@shared/lib/bars";

const { Provider, useBar } = createBarContext("useNavbar");

/** Навигационная панель поддерева: её создаёт экран или layout навигатора */
export const NavbarProvider = Provider;

/** Навигационная панель поддерева */
export const useNavbar = useBar;

/** Измеренная высота навигационной панели — для отступов контента */
export const useNavbarHeight = (): number => useBarHeight(useNavbar());
