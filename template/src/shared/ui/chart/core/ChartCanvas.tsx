import { Canvas } from "@shopify/react-native-skia";
import React, { FC, ReactNode } from "react";
import { StyleSheet } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";

import { ChartContext, useChartContext } from "./chart-context";
import type { useChartInteraction } from "./interaction/useChartInteraction";

export interface ChartCanvasProps {
  gesture: ReturnType<typeof useChartInteraction>["gesture"];
  skiaChildren: ReactNode[];
}

export const ChartCanvas: FC<ChartCanvasProps> = ({
  gesture,
  skiaChildren,
}) => {
  const context = useChartContext();

  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={StyleSheet.absoluteFill}>
        <ChartContext.Provider value={context}>
          {skiaChildren}
        </ChartContext.Provider>
      </Canvas>
    </GestureDetector>
  );
};
