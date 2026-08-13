import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import React, {
  ReactElement,
  ReactNode,
  RefAttributes,
  useMemo,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import {
  Carousel as RNCarousel,
  CarouselProps,
  CarouselRef,
} from "react-native-reanimated-carousel";

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
import { useCarouselAutoplay } from "./hooks";

const DEFAULT_HEIGHT = 180;

export type TCarouselWrapProps<T> = Omit<
  CarouselProps<T>,
  "autoplayDirection"
> & {
  /**
   * Ручной свайп останавливает автопрокрутку насовсем (программные
   * scrollTo/next/prev не считаются). Default false.
   */
  stopAutoplayOnInteraction?: boolean;
  /**
   * Без loop: возобновлять автопрокрутку после отмотки назад с конца.
   * Default true.
   */
  resumeAutoplayAfterEnd?: boolean;
  /**
   * Последний слайд достигнут: без автоплея — при приземлении, с активным
   * автоплеем — после завершения его интервала. Один вызов за пребывание.
   */
  onReachEnd?: () => void;
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
 * `useCarousel()`. Автопрокрутка — собственный движок useCarouselAutoplay;
 * все пропы библиотеки прокидываются.
 */
const CarouselRoot = ({
  props,
  slots,
  content,
  forwardedRef,
}: CompoundRootProps<
  TCarouselWrapProps<unknown>,
  typeof carouselSlots,
  CarouselRef
>) => {
  const {
    autoplay,
    autoplayInterval = 3000,
    stopAutoplayOnInteraction = false,
    resumeAutoplayAfterEnd = true,
    loop = true,
    defaultIndex = 0,
    data,
    progress: externalProgress,
    onProgressChange,
    onScrollStart,
    onSnapToItem,
    onReachEnd,
    style,
    ...rest
  } = props;
  const innerRef = useRef<CarouselRef>(null);
  /** Абсолютный прогресс — быстрый UI-путь для слот-компонентов. */
  const internalProgress = useSharedValue(0);
  const progress = externalProgress ?? internalProgress;
  const touching = useSharedValue(false);

  const {
    effectiveAutoplay,
    autoplayActive,
    activeIndex,
    cycleDuration,
    handleTouchStart,
    handleTouchEnd,
    handleScrollStart,
    handleSnapToItem,
    beginControlInteraction,
  } = useCarouselAutoplay({
    enabled: !!autoplay,
    interval: autoplayInterval,
    stopOnInteraction: stopAutoplayOnInteraction,
    resumeAfterEnd: resumeAutoplayAfterEnd,
    loop,
    count: data.length,
    initialIndex: defaultIndex,
    progress,
    touching,
    instanceRef: innerRef,
    onScrollStart,
    onSnapToItem,
    onReachEnd,
  });

  const api = useMemo<ICarouselApi>(
    () => ({
      progress,
      count: data.length,
      loop,
      autoplay: effectiveAutoplay,
      autoplayActive,
      activeIndex,
      cycleDuration,
      autoplayInterval,
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
      effectiveAutoplay,
      autoplayActive,
      activeIndex,
      cycleDuration,
      autoplayInterval,
      touching,
      beginControlInteraction,
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
      <View>
        {!progressBarsInside &&
          progressBarsPosition === "top" &&
          renderProgressBars()}
        {!dotsInside && dotsPosition === "top" && renderDots()}
        <View style={styles.frame}>
          <View
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <RNCarousel
              {...(rest as CarouselProps<unknown>)}
              ref={mergeRefs([innerRef, forwardedRef])}
              loop={loop}
              defaultIndex={defaultIndex}
              autoplay={false}
              onScrollStart={handleScrollStart}
              onSnapToItem={handleSnapToItem}
              data={data}
              style={[styles.carousel, style]}
              progress={progress}
              onProgressChange={onProgressChange}
            />
          </View>
          <View pointerEvents={"box-none"} style={StyleSheet.absoluteFill}>
            {progressBarsInside && renderProgressBars()}
            {dotsInside && renderDots()}
            {slots.arrows.render()}
            {slots.counter.render()}
          </View>
        </View>
        {!progressBarsInside &&
          progressBarsPosition === "bottom" &&
          renderProgressBars()}
        {!dotsInside && dotsPosition === "bottom" && renderDots()}
        {content}
      </View>
    </CarouselContext.Provider>
  );
};

const CarouselCompound = createCompound<
  TCarouselWrapProps<unknown>,
  CarouselRef
>()({
  name: "Carousel",
  render: CarouselRoot,
  slots: carouselSlots,
});

type TCarouselComponent = (<T>(
  props: CompoundProps<TCarouselWrapProps<T>, typeof carouselSlots> &
    RefAttributes<CarouselRef>,
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
    width: "100%",
    height: DEFAULT_HEIGHT,
  },
});
