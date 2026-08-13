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
import { CarouselProgressBars } from "./components/CarouselProgressBars";
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
  /**
   * Последний слайд достигнут: без автоплея — при приземлении, с активным
   * автоплеем — после завершения его интервала. Один вызов за пребывание.
   */
  onReachEnd?: () => void;
  /** Прямой ref к инстансу библиотеки (базовое API есть в useCarousel). */
  carouselRef?: Ref<ICarouselInstance>;
  /** Слот-компоненты (Carousel.Dots и т.п.) и свои контролы (useCarousel). */
  children?: ReactNode;
};

/**
 * Обёртка над react-native-reanimated-carousel: без настроек — зацикленная
 * карусель на всю ширину контейнера. Контролы — слот-компоненты
 * `Carousel.Dots`/`Carousel.ProgressBars`/`Carousel.Counter`/`Carousel.Arrows`
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
    beginControlInteraction,
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
        const instance = innerRef.current;

        if (!instance || data.length <= 1) {
          return;
        }

        const currentIndex = instance.getCurrentIndex();

        if (index < 0 || index >= data.length || index === currentIndex) {
          return;
        }

        beginControlInteraction();
        instance.scrollTo({
          index,
          animated,
          onFinished: animated ? undefined : () => handleScrollEnd(index),
        });
      },
      next: () => {
        const instance = innerRef.current;

        if (!instance || data.length <= 1) {
          return;
        }

        const currentIndex = instance.getCurrentIndex();

        if (!loop && currentIndex === data.length - 1) {
          return;
        }

        beginControlInteraction();
        instance.next();
      },
      prev: () => {
        const instance = innerRef.current;

        if (!instance || data.length <= 1) {
          return;
        }

        const currentIndex = instance.getCurrentIndex();

        if (!loop && currentIndex === 0) {
          return;
        }

        beginControlInteraction();
        instance.prev();
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
      beginControlInteraction,
      handleScrollEnd,
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
    ProgressBars: CarouselProgressBars,
    Counter: CarouselCounter,
    Arrows: CarouselArrows,
  },
);

const styles = StyleSheet.create({
  carousel: {
    alignSelf: "center",
  },
});
