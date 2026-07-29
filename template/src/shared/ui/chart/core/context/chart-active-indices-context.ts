import { createContext, useContext } from "react";
import type { DerivedValue } from "react-native-reanimated";

/** Индексы активных точек для каждого касания. */
export interface ChartActiveIndicesState {
  activeIndices: DerivedValue<number[]>;
  activeIndices2: DerivedValue<number[]>;
}

export const ChartActiveIndicesContext =
  createContext<ChartActiveIndicesState | null>(null);

export const useChartActiveIndices = (): ChartActiveIndicesState => {
  const context = useContext(ChartActiveIndicesContext);

  if (!context) {
    throw new Error("useChartActiveIndices must be used inside <Chart>.");
  }

  return context;
};
