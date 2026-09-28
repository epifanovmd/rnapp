import { TDialogDirection } from "./types";

export const isVerticalDirection = (direction: TDialogDirection) => {
  "worklet";

  return direction === "up" || direction === "down";
};

export const directionSign = (direction: TDialogDirection) => {
  "worklet";

  return direction === "down" || direction === "right" ? 1 : -1;
};
