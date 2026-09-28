import { Circle, Group, vec } from "@shopify/react-native-skia";
import React from "react";
import { useDerivedValue } from "react-native-reanimated";

import type { MarkerCircleProps } from "./types";

/** Читает готовый пиксель из resolvedPositions по своему индексу. */
export const MarkerCircle: React.FC<MarkerCircleProps> = ({
  marker,
  index,
  positions,
  defaultRadius,
}) => {
  const center = useDerivedValue(() => {
    const position = positions.value[index];

    return position ? vec(position.x, position.y) : vec(0, 0);
  }, [positions, index]);

  const opacity = useDerivedValue(
    () => (positions.value[index] ? 1 : 0),
    [positions, index],
  );

  return (
    <Group opacity={opacity}>
      <Circle
        c={center}
        r={marker.radius ?? defaultRadius}
        color={marker.color}
        style={marker.style ?? "fill"}
        strokeWidth={
          marker.style === "stroke" ? (marker.strokeWidth ?? 2) : undefined
        }
      />
    </Group>
  );
};
