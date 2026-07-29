import { Canvas } from "@shopify/react-native-skia";
import React, { FC, PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
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
import type { ChartGesture } from "./interaction/useChartInteraction";

export interface ChartCanvasProps extends PropsWithChildren {
  /** Жест pan графика — принимается напрямую (не через контекст), нужен только `GestureDetector` здесь. */
  gesture: ChartGesture;
}

/**
 * Skia `<Canvas>` использует свой собственный (не-DOM) реконсилер, поэтому обычные
 * React-контексты не пересекают эту границу сами по себе — их нужно явно
 * заново предоставить внутри дерева `<Canvas>`. Компонент сам перерисовывается на
 * любое изменение любого из контекстов (т.к. подписан на все, чтобы их
 * перепробросить), но это дёшево: если конкретное значение контекста не
 * изменилось, потребители внутри `<Canvas>` всё равно не перерисуются — React
 * сравнивает `value` у `Provider`, а не факт ре-рендера компонента.
 */
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
