import React from "react";
import { useDerivedValue } from "react-native-reanimated";

import { useChartGeometry, useChartSeries } from "../../core";
import { MarkerCircle } from "./MarkerCircle";
import { resolveMarkerPosition } from "./resolve-marker-position";
import type { MarkerLayerProps } from "./types";

export const MarkerLayer = React.memo(
  ({ visible = true, markers, defaultRadius = 4 }: MarkerLayerProps) => {
    const { seriesShared } = useChartSeries();
    const { xScale, yScale, dimensions } = useChartGeometry();

    // Все позиции разрешаются на UI-потоке — пересчёт без JS-бриджа.
    const resolvedPositions = useDerivedValue(() => {
      return markers.map(marker =>
        resolveMarkerPosition(
          marker.anchor,
          seriesShared.value,
          xScale,
          yScale,
          dimensions.padding,
        ),
      );
    }, [markers, seriesShared, xScale, yScale, dimensions.padding]);

    if (!visible) {
      return null;
    }

    return (
      <>
        {markers.map((marker, index) => (
          <MarkerCircle
            key={marker.id}
            marker={marker}
            index={index}
            positions={resolvedPositions}
            defaultRadius={defaultRadius}
          />
        ))}
      </>
    );
  },
);
