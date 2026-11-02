import type { SharedValue } from "react-native-reanimated";

/** Число или shared value: отступ, который бывает статичным или анимируемым. */
export type TAnimatedNumber = number | SharedValue<number>;

/** Текущее значение `TAnimatedNumber`; читается и в worklet. */
export const readAnimatedNumber = (value: TAnimatedNumber) => {
  "worklet";

  return typeof value === "number" ? value : value.value;
};
