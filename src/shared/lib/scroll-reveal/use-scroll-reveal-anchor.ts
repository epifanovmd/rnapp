import { RefObject, useCallback, useEffect, useRef } from "react";
import type { View } from "react-native";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";

import { readAnimatedNumber } from "../animation";
import { revealProgress } from "./reveal-progress";
import { IScrollContent, useScrollContent } from "./scroll-content-context";
import type { IScrollReveal } from "./use-scroll-reveal";

export interface IScrollRevealAnchor {
  ref: RefObject<View | null>;
  /** `onLayout` якоря — перемер положения. */
  onLayout: () => void;
}

/**
 * Якорь перехода в прокручиваемом контенте: меряется относительно контента
 * скролла (при своей раскладке и раскладке контента), ведёт `reveal.progress`
 * от offsetY — на кадре без измерений. Скролл — из контекста экрана
 * (`ScreenScroll`) или `content`.
 */
export const useScrollRevealAnchor = (
  reveal: IScrollReveal,
  content?: IScrollContent | null,
): IScrollRevealAnchor => {
  const contextContent = useScrollContent();
  const scroll = content === undefined ? contextContent : content;
  const ref = useRef<View | null>(null);
  const anchorTop = useSharedValue(0);
  const anchorHeight = useSharedValue(0);

  const measure = useCallback(() => {
    const anchor = ref.current;
    const container = scroll?.contentRef.current;

    if (!anchor || !container) return;

    anchor.measureLayout(container, (_x, y, _width, height) => {
      anchorTop.value = y;
      anchorHeight.value = height;
    });
  }, [scroll, anchorTop, anchorHeight]);

  const { bind, progress } = reveal;

  useEffect(() => {
    bind(scroll);

    return () => bind(null);
  }, [bind, scroll]);

  useEffect(() => scroll?.subscribeLayout(measure), [scroll, measure]);

  const offsetY = scroll?.telemetry.offsetY;
  const topInset = scroll?.topInset ?? 0;
  const { start, end, distance } = reveal.range;

  useAnimatedReaction(
    () =>
      offsetY
        ? revealProgress(
            offsetY.value + readAnimatedNumber(topInset),
            anchorTop.value,
            anchorHeight.value,
            { start, end, distance },
          )
        : 0,
    next => {
      progress.value = next;
    },
    [offsetY, topInset, anchorTop, anchorHeight, start, end, distance],
  );

  return { ref, onLayout: measure };
};
