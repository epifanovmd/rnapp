import { createBarContext, useBarHeight } from "@shared/lib/bars";
import { SharedValue } from "react-native-reanimated";

const { Provider, useBar } = createBarContext("useNavbar");

/** Навигационная панель поддерева: её создаёт экран или layout навигатора */
export const NavbarProvider = Provider;

/** Навигационная панель поддерева */
export const useNavbar = useBar;

/**
 * Измеренная высота навигационной панели (JS). Меняется скачком — для
 * отступов, где живая высота шапки не важна; иначе NavbarInset/useNavbarInset.
 */
export const useNavbarHeight = (): number => useBarHeight(useNavbar());

/** Отступ контента под панель как shared value — анимируется к новой высоте */
export const useNavbarInset = (): SharedValue<number> => useNavbar().inset;
