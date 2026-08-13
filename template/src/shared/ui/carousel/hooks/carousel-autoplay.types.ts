import { RefObject } from "react";
import { SharedValue } from "react-native-reanimated";
import { CarouselRef } from "react-native-reanimated-carousel";

export interface ICarouselAutoplayOptions {
  enabled: boolean;
  interval: number;
  stopOnInteraction: boolean;
  resumeAfterEnd: boolean;
  loop: boolean;
  count: number;
  initialIndex: number;
  progress: SharedValue<number>;
  touching: SharedValue<boolean>;
  instanceRef: RefObject<CarouselRef | null>;
  onScrollStart?: () => void;
  onSnapToItem?: (index: number) => void;
  onReachEnd?: () => void;
}

export interface ICarouselAutoplay {
  effectiveAutoplay: boolean;
  autoplayActive: SharedValue<boolean>;
  activeIndex: SharedValue<number>;
  cycleDuration: SharedValue<number>;
  handleTouchStart: () => void;
  handleTouchEnd: () => void;
  handleScrollStart: () => void;
  handleSnapToItem: (index: number) => void;
  beginControlInteraction: () => void;
}
