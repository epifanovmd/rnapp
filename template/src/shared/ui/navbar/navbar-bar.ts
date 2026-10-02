import {
  clampOffset,
  createBarContext,
  resolveCollapseRange,
  useBarHeight,
} from "@shared/lib/bars";
import {
  DerivedValue,
  SharedValue,
  useDerivedValue,
} from "react-native-reanimated";

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

/**
 * Видимая высота панели (UI-поток): высота минус уехавшая часть — нижний край
 * шапки над контентом (например, отступ оверлея под строкой поиска).
 */
export const useNavbarVisibleHeight = (): DerivedValue<number> => {
  const { height, pinned, offset } = useNavbar();

  return useDerivedValue(
    () =>
      height.value -
      clampOffset(offset.value, resolveCollapseRange(height.value, pinned.value)),
    [height, pinned, offset],
  );
};
