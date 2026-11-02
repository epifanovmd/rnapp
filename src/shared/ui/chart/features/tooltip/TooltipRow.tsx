import { Circle, Text } from "@shopify/react-native-skia";
import React, { FC } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { tooltipRowLayout } from "./tooltip-row-layout";
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
  // Индекс и метрики — в зависимостях: второй палец сдвигает строки, и без
  // пересоздания derived строка осталась бы на старом месте.
  const layout = useDerivedValue(
    () =>
      tooltipRowLayout(boxX.value, boxY.value, index, {
        paddingX,
        paddingY,
        rowHeight,
        dotRadius,
        fontSize,
      }),
    [boxX, boxY, index, paddingX, paddingY, rowHeight, dotRadius, fontSize],
  );

  const dotCenter = useDerivedValue(
    () => ({ x: layout.value.dotX, y: layout.value.dotY }),
    [layout],
  );
  const textX = useDerivedValue(() => layout.value.textX, [layout]);
  const textY = useDerivedValue(() => layout.value.textY, [layout]);

  return (
    <>
      <Circle c={dotCenter} r={dotRadius} color={dotColor} />
      <Text x={textX} y={textY} text={text} font={font} color={textColor} />
    </>
  );
};
