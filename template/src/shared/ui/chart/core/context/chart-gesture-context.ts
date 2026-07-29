import { createContext, useContext } from "react";
import type { SharedValue } from "react-native-reanimated";

export interface ChartGestureContextValue {
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  isActive: SharedValue<boolean>;
  touchX2: SharedValue<number>;
  touchY2: SharedValue<number>;
  isSecondActive: SharedValue<boolean>;
}

export const ChartGestureContext =
  createContext<ChartGestureContextValue | null>(null);

export const useChartGesture = (): ChartGestureContextValue => {
  const context = useContext(ChartGestureContext);

  if (!context) {
    throw new Error("useChartGesture must be used inside <Chart>.");
  }

  return context;
};
