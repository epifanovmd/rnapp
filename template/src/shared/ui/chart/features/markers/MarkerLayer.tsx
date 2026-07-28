import { Circle } from "@shopify/react-native-skia";
import React, { useMemo } from "react";

import { useChartContext } from "../../core/chart-context";
import { DEFAULT_SERIES_COLORS } from "../../core/default-series-colors";
import { useOnTouchDown } from "../../core/interaction/useOnTouchDown";
import { resolveSeriesColor } from "../../core/resolve-series-color";
import type { ChartLayerComponent } from "../../core/types";
import { resolveMarkerPosition } from "./resolve-marker-position";
import type { ChartMarker } from "./types";

export interface MarkerLayerProps {
  visible?: boolean;
  markers: ChartMarker[];
  defaultRadius?: number;
  colors?: string[];
  hitSlop?: number;
  onMarkerPress?: (marker: ChartMarker) => void;
}

interface ResolvedMarker extends ChartMarker {
  x: number;
  y: number;
}

export const MarkerLayer: ChartLayerComponent<MarkerLayerProps> = ({
  visible = true,
  markers,
  defaultRadius = 5,
  colors = DEFAULT_SERIES_COLORS,
  hitSlop = 8,
  onMarkerPress,
}) => {
  const { series, xScale, yScale, interaction } = useChartContext();

  const resolved = useMemo(
    () =>
      markers.reduce<ResolvedMarker[]>((acc, marker) => {
        const position = resolveMarkerPosition(
          marker.anchor,
          series,
          xScale,
          yScale,
        );

        if (position) {
          acc.push({ ...marker, ...position });
        }

        return acc;
      }, []),
    [markers, series, xScale, yScale],
  );

  useOnTouchDown(
    interaction.touchX,
    interaction.touchY,
    interaction.isActive,
    (x, y) => {
      if (!onMarkerPress) {
        return;
      }

      const hit = resolved.find(marker => {
        const r = (marker.radius ?? defaultRadius) + hitSlop;
        const dx = x - marker.x;
        const dy = y - marker.y;

        return dx * dx + dy * dy <= r * r;
      });

      if (hit) {
        onMarkerPress(hit);
      }
    },
  );

  if (!visible) {
    return null;
  }

  return (
    <>
      {resolved.map((marker, index) => (
        <Circle
          key={marker.id}
          cx={marker.x}
          cy={marker.y}
          r={marker.radius ?? defaultRadius}
          color={resolveSeriesColor(marker, index, colors)}
          style={marker.style ?? "fill"}
          strokeWidth={
            marker.style === "stroke" ? (marker.strokeWidth ?? 2) : undefined
          }
        />
      ))}
    </>
  );
};

MarkerLayer.layerKind = "skia";
