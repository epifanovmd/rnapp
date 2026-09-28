export type TCarouselControlPosition = "top" | "bottom";

export type TCarouselControlPlacement = "inside" | "outside";

export interface ICarouselPositionedControlProps {
  position?: TCarouselControlPosition;
  placement?: TCarouselControlPlacement;
}
