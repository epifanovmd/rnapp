import { useMemo, useRef } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";

import { IRevealRangeOptions } from "./reveal-progress";
import { IScrollContent } from "./scroll-content-context";

/**
 * Контроллер перехода: прогресс и прокрутка к началу. Создаётся где удобно —
 * в компоненте с шапкой (навбар страницы, опции навигатора) или рядом с
 * якорем; привязывается к скроллу якорем (`useScrollRevealAnchor`,
 * `ScrollRevealAnchor`) внутри прокручиваемого контента.
 */
export interface IScrollReveal {
  /** 0 — якорь виден, 1 — ушёл за верхний край (переход завершён); UI-поток. */
  progress: SharedValue<number>;
  /** Участок пути якоря, на котором идёт переход. */
  range: IRevealRangeOptions;
  /** Прокрутка к началу скролла, к которому привязан якорь. */
  scrollToTop: (animated?: boolean) => void;
  /** Привязка к скроллу — вызывает якорь. */
  bind: (content: IScrollContent | null) => void;
}

/**
 * Переход содержимого при уходе якоря за верх скролла (например, в шапку).
 *
 * ```tsx
 * const reveal = useScrollReveal();
 * <Navbar><Navbar.Content><NavbarReveal progress={reveal.progress} … /></Navbar.Content></Navbar>
 * <ScreenScroll>
 *   <ScrollRevealAnchor reveal={reveal}>…</ScrollRevealAnchor>
 * </ScreenScroll>
 * ```
 */
export const useScrollReveal = ({
  start,
  end,
  distance,
}: IRevealRangeOptions = {}): IScrollReveal => {
  const progress = useSharedValue(0);
  const contentRef = useRef<IScrollContent | null>(null);

  return useMemo<IScrollReveal>(
    () => ({
      progress,
      range: { start, end, distance },
      scrollToTop: animated => contentRef.current?.scrollToTop(animated),
      bind: content => {
        contentRef.current = content;
      },
    }),
    [progress, start, end, distance],
  );
};
