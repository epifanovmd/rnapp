import React from "react";
import { useDerivedValue } from "react-native-reanimated";

import { useChartGeometry, useChartSeries } from "../../core";
import { MarkerCircle } from "./MarkerCircle";
import { resolveMarkerPosition } from "./resolve-marker-position";
import type { MarkerLayerProps } from "./types";

export const MarkerLayer = React.memo(
  ({ visible = true, markers, defaultRadius = 5 }: MarkerLayerProps) => {
    const { seriesShared } = useChartSeries();
    const { xScale, yScale } = useChartGeometry();

    // Все позиции разрешаются на UI-потоке — пересчёт без JS-бриджа.
    const resolvedPositions = useDerivedValue(() => {
      return markers.map(marker =>
        resolveMarkerPosition(
          marker.anchor,
          seriesShared.value,
          xScale,
          yScale,
        ),
      );
    }, [markers, seriesShared, xScale, yScale]);

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
