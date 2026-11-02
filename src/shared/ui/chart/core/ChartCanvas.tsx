import { Canvas } from "@shopify/react-native-skia";
import React, { FC, PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import type { ComposedGesture } from "react-native-gesture-handler";
import { GestureDetector } from "react-native-gesture-handler";

import {
  ChartActiveIndicesContext,
  ChartGeometryContext,
  ChartGestureContext,
  ChartSeriesContext,
  useChartActiveIndices,
  useChartGeometry,
  useChartGesture,
  useChartSeries,
} from "./context";

export interface ChartCanvasProps extends PropsWithChildren {
  /** Жесты графика: перекрестие и навигация по окну. */
  gesture: ComposedGesture;
}
/** Skia Canvas с gesture-детектором и пробросом контекстов внутрь. */
export const ChartCanvas: FC<ChartCanvasProps> = ({ gesture, children }) => {
  const geometry = useChartGeometry();
  const series = useChartSeries();
  const gestureContext = useChartGesture();
  const activeIndices = useChartActiveIndices();

  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={StyleSheet.absoluteFill}>
        <ChartGeometryContext.Provider value={geometry}>
          <ChartSeriesContext.Provider value={series}>
            <ChartGestureContext.Provider value={gestureContext}>
              <ChartActiveIndicesContext.Provider value={activeIndices}>
                {children}
              </ChartActiveIndicesContext.Provider>
            </ChartGestureContext.Provider>
          </ChartSeriesContext.Provider>
        </ChartGeometryContext.Provider>
      </Canvas>
    </GestureDetector>
  );
};
