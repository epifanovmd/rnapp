import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import React, {
  ReactElement,
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

import {
  CompoundProps,
  CompoundRootProps,
  CompoundStatics,
  createCompound,
  slot,
} from "../../lib/slots";
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
  /** Compound-слоты и свои компоненты на useCarousel(). */
  children?: ReactNode;
};

const carouselSlots = {
  progressBars: slot.of(CarouselProgressBars),
  dots: slot.of(CarouselDots),
  counter: slot.of(CarouselCounter),
  arrows: slot.of(CarouselArrows),
};

/**
 * Обёртка над react-native-reanimated-carousel: без настроек — зацикленная
 * карусель на всю ширину контейнера. Контролы объявлены compound-слотами;
 * свои контролы получают API через
 * `useCarousel()`. Автопрокрутка — собственный движок useCarouselAutoPlay;
 * все пропы библиотеки прокидываются.
 */
const CarouselRoot = ({
  props,
  slots,
  content,
}: CompoundRootProps<TCarouselWrapProps<unknown>, typeof carouselSlots>) => {
  const {
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
    ...rest
  } = props;
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
  const progressBarsPosition = slots.progressBars.props?.position ?? "top";
  const progressBarsPlacement = slots.progressBars.props?.placement ?? "inside";
  const dotsPosition = slots.dots.props?.position ?? "bottom";
  const dotsPlacement = slots.dots.props?.placement ?? "outside";

  const progressBarsInside = progressBarsPlacement === "inside";
  const dotsInside = dotsPlacement === "inside";

  const renderProgressBars = () =>
    slots.progressBars.render({
      defaults: progressBarsInside
        ? {
            style: [
              styles.insideControl,
              progressBarsPosition === "top"
                ? styles.insideTop
                : styles.insideBottom,
            ],
          }
        : undefined,
    });

  const renderDots = () =>
    slots.dots.render({
      defaults: dotsInside
        ? {
            style: [
              styles.insideControl,
              styles.centeredControl,
              dotsPosition === "top" ? styles.insideTop : styles.insideBottom,
            ],
          }
        : undefined,
    });

  return (
    <CarouselContext.Provider value={api}>
      <View style={containerStyle} onLayout={handleLayout}>
        {!progressBarsInside &&
          progressBarsPosition === "top" &&
          renderProgressBars()}
        {!dotsInside && dotsPosition === "top" && renderDots()}
        {slideWidth > 0 && (
          <View style={[styles.frame, { height }]}>
            <View
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <RNCarousel
                {...(rest as TCarouselProps<unknown>)}
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
            <View pointerEvents={"box-none"} style={StyleSheet.absoluteFill}>
              {progressBarsInside && renderProgressBars()}
              {dotsInside && renderDots()}
              {slots.arrows.render()}
              {slots.counter.render()}
            </View>
          </View>
        )}
        {!progressBarsInside &&
          progressBarsPosition === "bottom" &&
          renderProgressBars()}
        {!dotsInside && dotsPosition === "bottom" && renderDots()}
        {content}
      </View>
    </CarouselContext.Provider>
  );
};

const CarouselCompound = createCompound<TCarouselWrapProps<unknown>>()({
  name: "Carousel",
  render: CarouselRoot,
  slots: carouselSlots,
});

type TCarouselComponent = (<T>(
  props: CompoundProps<TCarouselWrapProps<T>, typeof carouselSlots>,
) => ReactElement | null) &
  CompoundStatics<typeof carouselSlots>;

export const Carousel = CarouselCompound as unknown as TCarouselComponent;

const styles = StyleSheet.create({
  frame: {
    position: "relative",
  },
  insideControl: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1,
  },
  insideTop: {
    top: 0,
  },
  insideBottom: {
    bottom: 0,
  },
  centeredControl: {
    justifyContent: "center",
  },
  carousel: {
    alignSelf: "center",
  },
});
