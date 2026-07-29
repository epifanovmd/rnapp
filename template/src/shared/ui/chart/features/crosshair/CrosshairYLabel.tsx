import { Group, RoundedRect, Text } from "@shopify/react-native-skia";
import React, { FC, useMemo } from "react";
import { SharedValue, useDerivedValue } from "react-native-reanimated";

import { LABEL_GAP, LABEL_PADDING_X, LABEL_PADDING_Y } from "../../core";
import type { CrosshairYLabelProps } from "./types";

export const CrosshairYLabel = React.memo(
  ({
    anchorPoint,
    edgeX,
    canvasWidth,
    position,
    text,
    font,
    fontSize,
    background,
    textColor,
  }: CrosshairYLabelProps) => {
    const metrics = useMemo(() => font.measureText(text), [font, text]);
    const boxWidth = metrics.width + LABEL_PADDING_X * 2;
    const boxHeight = fontSize + LABEL_PADDING_Y * 2;
    const rawBoxX =
      position === "right" ? edgeX + LABEL_GAP : edgeX - boxWidth - LABEL_GAP;
    const boxX = Math.min(
      Math.max(rawBoxX, 0),
      Math.max(canvasWidth - boxWidth, 0),
    );

    const boxY = useDerivedValue(
      () => anchorPoint.value.y - boxHeight / 2,
      [anchorPoint, boxHeight],
    );

    const textY = useDerivedValue(
      () => anchorPoint.value.y + fontSize * 0.3,
      [anchorPoint, fontSize],
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
          x={boxX + LABEL_PADDING_X}
          y={textY}
          text={text}
          font={font}
          color={textColor}
        />
      </Group>
    );
  },
);
