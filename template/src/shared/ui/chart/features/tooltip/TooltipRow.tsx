import { Circle, Text, vec } from "@shopify/react-native-skia";
import React, { FC } from "react";
import { useDerivedValue } from "react-native-reanimated";

import type { TooltipRowProps } from "./types";

export const TooltipRow: FC<TooltipRowProps> = ({
  index,
  boxX,
  boxY,
  text,
  dotColor,
  font,
  fontSize,
  textColor,
  paddingX,
  paddingY,
  rowHeight,
  dotRadius,
}) => {
  const rowCenterY = paddingY + rowHeight * index + rowHeight / 2;

  const dotCenter = useDerivedValue(
    () => vec(boxX.value + paddingX + dotRadius, boxY.value + rowCenterY),
    [boxX, boxY],
  );

  const textX = useDerivedValue(
    () => boxX.value + paddingX * 2 + dotRadius * 2,
    [boxX],
  );

  const textY = useDerivedValue(
    () => boxY.value + rowCenterY + fontSize * 0.3,
    [boxY],
  );

  return (
    <>
      <Circle c={dotCenter} r={dotRadius} color={dotColor} />
      <Text x={textX} y={textY} text={text} font={font} color={textColor} />
    </>
  );
};
