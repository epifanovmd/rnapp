import {
  TCarouselProgressBarsPlacement,
  TCarouselProgressBarsPosition,
} from "../carousel-progress-bars.types";

interface IProgressBarsTopOptions {
  position: TCarouselProgressBarsPosition;
  placement: TCarouselProgressBarsPlacement;
  inset: number;
  barHeight: number;
  carouselHeight: number;
}

export const getProgressBarsTop = ({
  position,
  placement,
  inset,
  barHeight,
  carouselHeight,
}: IProgressBarsTopOptions): number => {
  if (position === "top") {
    return placement === "inside" ? inset : -barHeight - inset;
  }

  return placement === "inside"
    ? carouselHeight - barHeight - inset
    : carouselHeight + inset;
};
