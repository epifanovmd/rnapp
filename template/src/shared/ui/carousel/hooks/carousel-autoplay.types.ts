import { RefObject } from "react";
import { SharedValue } from "react-native-reanimated";
import { ICarouselInstance } from "react-native-reanimated-carousel";

export interface ICarouselAutoPlayOptions {
  enabled: boolean;
  interval: number;
  stopOnInteraction: boolean;
  resumeAfterEnd: boolean;
  loop: boolean;
  count: number;
  progress: SharedValue<number>;
  touching: SharedValue<boolean>;
  instanceRef: RefObject<ICarouselInstance | null>;
  onScrollStart?: () => void;
  onScrollEnd?: (index: number) => void;
  onReachEnd?: () => void;
}

export interface ICarouselAutoPlay {
  effectiveAutoPlay: boolean;
  autoPlayActive: SharedValue<boolean>;
  activeIndex: SharedValue<number>;
  cycleDuration: SharedValue<number>;
  handleTouchStart: () => void;
  handleTouchEnd: () => void;
  handleScrollStart: () => void;
  handleScrollEnd: (index: number) => void;
  beginControlInteraction: () => void;
}
