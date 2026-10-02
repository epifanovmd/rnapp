import { RefObject, useCallback, useEffect, useRef } from "react";
import type { View } from "react-native";
import { DerivedValue, useDerivedValue, useSharedValue } from "react-native-reanimated";

import { readAnimatedNumber } from "../animation";
import { IRevealRangeOptions, revealProgress } from "./reveal-progress";
import { IScrollContent, useScrollContent } from "./scroll-content-context";

export interface IScrollRevealOptions extends IRevealRangeOptions {
  /** Скролл, в котором живёт якорь; по умолчанию — скролл экрана из контекста. */
  content?: IScrollContent | null;
}

export interface IScrollReveal {
  /** 0 — якорь виден, 1 — ушёл за верхний край (переход завершён); UI-поток. */
  progress: DerivedValue<number>;
  /** Ref элемента-якоря. */
  anchorRef: RefObject<View | null>;
  /** `onLayout` якоря — перемер положения. */
  onLayout: () => void;
  /** Прокрутка экрана к началу (тап по появившейся шапке). */
  scrollToTop: (animated?: boolean) => void;
}

const noop = () => {};

/**
 * Прогресс ухода элемента-якоря за верх видимой области скролла — для
 * содержимого, которое при этом появляется в другом месте (шапке, панели).
 * Якорь меряется относительно контента скролла при смене раскладки (своей
 * или контента), на кадре — только пересчёт от offsetY, без измерений.
 *
 * ```tsx
 * const reveal = useScrollReveal();
 * <View ref={reveal.anchorRef} onLayout={reveal.onLayout}>…</View>
 * <RevealView progress={reveal.progress}>…</RevealView>
 * ```
 */
export const useScrollReveal = (
  options: IScrollRevealOptions = {},
): IScrollReveal => {
  const contextContent = useScrollContent();
  const content =
    options.content === undefined ? contextContent : options.content;
  const { start, end, distance } = options;

  const anchorRef = useRef<View | null>(null);
  const anchorTop = useSharedValue(0);
  const anchorHeight = useSharedValue(0);

  const measure = useCallback(() => {
    const anchor = anchorRef.current;
    const container = content?.contentRef.current;

    if (!anchor || !container) return;

    anchor.measureLayout(container, (_x, y, _width, height) => {
      anchorTop.value = y;
      anchorHeight.value = height;
    });
  }, [content, anchorTop, anchorHeight]);

  useEffect(() => content?.subscribeLayout(measure), [content, measure]);

  const offsetY = content?.telemetry.offsetY;
  const topInset = content?.topInset ?? 0;

  const progress = useDerivedValue(() => {
    if (!offsetY) return 0;

    return revealProgress(
      offsetY.value + readAnimatedNumber(topInset),
      anchorTop.value,
      anchorHeight.value,
      { start, end, distance },
    );
  }, [offsetY, topInset, anchorTop, anchorHeight, start, end, distance]);

  return {
    progress,
    anchorRef,
    onLayout: measure,
    scrollToTop: content?.scrollToTop ?? noop,
  };
};
