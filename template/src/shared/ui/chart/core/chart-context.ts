import { createContext, useContext } from "react";
import type { SharedValue } from "react-native-reanimated";

import type { ChartDimensions, IChartSeries, IScale } from "./types";

export interface ChartInteractionState {
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  isActive: SharedValue<boolean>;
  touchX2: SharedValue<number>;
  touchY2: SharedValue<number>;
  isSecondActive: SharedValue<boolean>;
}

export interface ChartContextValue {
  dimensions: ChartDimensions;
  xScale: IScale;
  yScale: IScale;
  series: IChartSeries[];
  interaction: ChartInteractionState;
}

export const ChartContext = createContext<ChartContextValue | null>(null);

export const useChartContext = (): ChartContextValue => {
  const context = useContext(ChartContext);

  if (!context) {
    throw new Error("Chart layer components must be rendered inside <Chart>.");
  }

  return context;
};
