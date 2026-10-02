import { useNavigation } from "@react-navigation/native";
import { createElement, useEffect } from "react";

import { INavbarRevealProps, NavbarReveal } from "./NavbarReveal";

/** Рендер шапки для `options.headerTitle` — фабрика вне компонента. */
const renderReveal = (props: INavbarRevealProps) => () =>
  createElement(NavbarReveal, props);

/**
 * Появление содержимого в шапке экрана: ставит `NavbarReveal` в
 * `options.headerTitle` и снимает при размонтировании. Прогресс — общий
 * shared value, поэтому скролл не перерисовывает шапку; опции обновляются
 * только при смене пропсов (текст, пресет).
 *
 * ```tsx
 * const reveal = useScrollReveal();
 * useNavbarReveal({ progress: reveal.progress, title, subtitle, onPress: reveal.scrollToTop });
 * ```
 */
export const useNavbarReveal = ({
  progress,
  title,
  subtitle,
  children,
  fallbackTitle,
  onPress,
  preset,
  distance,
}: INavbarRevealProps) => {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: renderReveal({
        progress,
        title,
        subtitle,
        children,
        fallbackTitle,
        onPress,
        preset,
        distance,
      }),
    });
  }, [
    navigation,
    progress,
    title,
    subtitle,
    children,
    fallbackTitle,
    onPress,
    preset,
    distance,
  ]);

  useEffect(
    () => () => navigation.setOptions({ headerTitle: undefined }),
    [navigation],
  );
};
