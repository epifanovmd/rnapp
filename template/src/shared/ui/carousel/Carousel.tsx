import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import React, {
  memo,
  ReactNode,
  Ref,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import {
  isSharedValue,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import RNCarousel, {
  ICarouselInstance,
  TCarouselProps,
} from "react-native-reanimated-carousel";
import { scheduleOnRN } from "react-native-worklets";

import { CarouselContext, ICarouselApi } from "./carousel-context";
import { CarouselArrows } from "./components/CarouselArrows";
import { CarouselCounter } from "./components/CarouselCounter";
import { CarouselDots } from "./components/CarouselDots";
import { CarouselStoryBars } from "./components/CarouselStoryBars";
import { useCarouselAutoPlay } from "./hooks";

const DEFAULT_HEIGHT = 180;

/** Omit, сохраняющий ветки union (mode/modeConfig — дискриминированы). */
type TDistributiveOmit<T, K extends keyof never> = T extends unknown
  ? Omit<T, K>
  : never;

export type TCarouselWrapProps<T> = TDistributiveOmit<
  TCarouselProps<T>,
  "width" | "height" | "ref"
> & {
  /** Ширина слайда; по умолчанию — ширина контейнера. */
  width?: number;
  height?: number;
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Ручной свайп останавливает автопрокрутку насовсем (программные
   * scrollTo/next/prev не считаются). Default false.
   */
  stopAutoPlayOnInteraction?: boolean;
  /**
   * Без loop: возобновлять автопрокрутку после отмотки назад с конца.
   * Default true.
   */
  resumeAutoPlayAfterEnd?: boolean;
  /** Достигнут последний слайд (любым способом); один вызов на приезд. */
  onReachEnd?: () => void;
  /** Прямой ref к инстансу библиотеки (базовое API есть в useCarousel). */
  carouselRef?: Ref<ICarouselInstance>;
  /** Слот-компоненты (Carousel.Dots и т.п.) и свои контролы (useCarousel). */
  children?: ReactNode;
};

/**
 * Обёртка над react-native-reanimated-carousel: без настроек — зацикленная
 * карусель на всю ширину контейнера. Контролы — слот-компоненты
 * `Carousel.Dots`/`Carousel.StoryBars`/`Carousel.Counter`/`Carousel.Arrows`
 * в children, свои — через `useCarousel()`. Автопрокрутка — собственный
 * движок useCarouselAutoPlay; все пропы либы прокидываются.
 */
const CarouselRoot = <T,>({
  width,
  height = DEFAULT_HEIGHT,
  autoPlay,
  autoPlayInterval = 2000,
  scrollAnimationDuration = 500,
  stopAutoPlayOnInteraction = false,
  resumeAutoPlayAfterEnd = true,
  loop = true,
  data,
  containerStyle,
  carouselRef,
  onProgressChange,
  onScrollStart,
  onScrollEnd,
  onReachEnd,
  style,
  children,
  ...rest
}: TCarouselWrapProps<T>) => {
  const innerRef = useRef<ICarouselInstance>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  /** Абсолютный прогресс — быстрый UI-путь для слот-компонентов. */
  const progress = useSharedValue(0);
  const touching = useSharedValue(false);

  const slideWidth = width ?? containerWidth;

  const {
    effectiveAutoPlay,
    autoPlayActive,
    activeIndex,
    cycleDuration,
    handleTouchStart,
    handleTouchEnd,
    handleScrollStart,
    handleScrollEnd,
    markProgrammatic,
  } = useCarouselAutoPlay({
    enabled: !!autoPlay,
    interval: autoPlayInterval,
    stopOnInteraction: stopAutoPlayOnInteraction,
    resumeAfterEnd: resumeAutoPlayAfterEnd,
    loop,
    count: data.length,
    progress,
    touching,
    instanceRef: innerRef,
    onScrollStart,
    onScrollEnd,
    onReachEnd,
  });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  // Внешний onProgressChange: shared получает absolute, функция —
  // (offsetPx, absolute), как в библиотеке.
  useAnimatedReaction(
    () => progress.value,
    (absolute, previous) => {
      if (absolute === previous || !onProgressChange) {
        return;
      }

      if (isSharedValue<number>(onProgressChange)) {
        onProgressChange.value = absolute;
      } else {
        scheduleOnRN(onProgressChange, -absolute * slideWidth, absolute);
      }
    },
    [onProgressChange, slideWidth],
  );

  const api = useMemo<ICarouselApi>(
    () => ({
      progress,
      count: data.length,
      loop,
      height,
      autoPlay: effectiveAutoPlay,
      autoPlayActive,
      activeIndex,
      cycleDuration,
      autoPlayInterval,
      scrollAnimationDuration,
      touching,
      scrollTo: (index, animated = true) => {
        markProgrammatic();
        innerRef.current?.scrollTo({ index, animated });
      },
      next: () => {
        markProgrammatic();
        innerRef.current?.next();
      },
      prev: () => {
        markProgrammatic();
        innerRef.current?.prev();
      },
    }),
    [
      progress,
      data.length,
      loop,
      height,
      effectiveAutoPlay,
      autoPlayActive,
      activeIndex,
      cycleDuration,
      autoPlayInterval,
      scrollAnimationDuration,
      touching,
      markProgrammatic,
    ],
  );

  return (
    <View style={containerStyle} onLayout={handleLayout}>
      {slideWidth > 0 && (
        <View
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <RNCarousel
            {...(rest as TCarouselProps<T>)}
            ref={mergeRefs([innerRef, carouselRef ?? null])}
            width={slideWidth}
            height={height}
            loop={loop}
            autoPlay={false}
            onScrollStart={handleScrollStart}
            onScrollEnd={handleScrollEnd}
            scrollAnimationDuration={scrollAnimationDuration}
            data={data}
            style={StyleSheet.flatten([
              styles.carousel,
              { width: containerWidth || slideWidth },
              style,
            ])}
            onProgressChange={progress}
          />
        </View>
      )}
      <CarouselContext.Provider value={api}>
        {children}
      </CarouselContext.Provider>
    </View>
  );
};

export const Carousel = Object.assign(
  memo(CarouselRoot) as typeof CarouselRoot,
  {
    Dots: CarouselDots,
    StoryBars: CarouselStoryBars,
    Counter: CarouselCounter,
    Arrows: CarouselArrows,
  },
);

const styles = StyleSheet.create({
  carousel: {
    alignSelf: "center",
  },
});
