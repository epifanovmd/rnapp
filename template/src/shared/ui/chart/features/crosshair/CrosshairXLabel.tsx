import { Group, RoundedRect, Text } from "@shopify/react-native-skia";
import React, { FC, useMemo } from "react";
import { SharedValue, useDerivedValue } from "react-native-reanimated";

import { LABEL_GAP, LABEL_PADDING_X, LABEL_PADDING_Y } from "../../core";
import type { CrosshairXLabelProps } from "./types";

export const CrosshairXLabel = React.memo(
  ({
    anchorX,
    edgeY,
    position,
    text,
    font,
    fontSize,
    background,
    textColor,
  }: CrosshairXLabelProps) => {
    const metrics = useMemo(() => font.measureText(text), [font, text]);
    const boxWidth = metrics.width + LABEL_PADDING_X * 2;
    const boxHeight = fontSize + LABEL_PADDING_Y * 2;
    const boxY =
      position === "top" ? edgeY - boxHeight - LABEL_GAP : edgeY + LABEL_GAP;

    const boxX = useDerivedValue(
      () => anchorX.value - boxWidth / 2,
      [anchorX, boxWidth],
    );

    const textX = useDerivedValue(
      () => anchorX.value - metrics.width / 2,
      [anchorX, metrics],
    );

    return (
      <Group>
        <RoundedRect
          x={boxX}
          y={boxY}
          width={boxWidth}
          height={boxHeight}
          r={4}
          color={background}
        />
        <Text
          x={textX}
          y={boxY + boxHeight - LABEL_PADDING_Y - fontSize * 0.22}
          text={text}
          font={font}
          color={textColor}
        />
      </Group>
    );
  },
);
