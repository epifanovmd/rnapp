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
    labelSide = "out",
    canvasHeight,
    text,
    font,
    fontSize,
    background,
    textColor,
  }: CrosshairYLabelProps) => {
    const metrics = useMemo(() => font.measureText(text), [font, text]);
    const boxWidth = metrics.width + LABEL_PADDING_X * 2;
    const boxHeight = fontSize + LABEL_PADDING_Y * 2;
    const isIn = labelSide === "in";
    const rawBoxX =
      position === "right"
        ? isIn
          ? edgeX - boxWidth - LABEL_GAP
          : edgeX + LABEL_GAP
        : isIn
          ? edgeX + LABEL_GAP
          : edgeX - boxWidth - LABEL_GAP;
    const boxX = Math.min(
      Math.max(rawBoxX, 0),
      Math.max(canvasWidth - boxWidth, 0),
    );

    const maxTop = Math.max(0, canvasHeight - boxHeight);

    const boxY = useDerivedValue(
      () => Math.min(Math.max(anchorPoint.value.y - boxHeight / 2, 0), maxTop),
      [anchorPoint, boxHeight, maxTop],
    );

    const textY = useDerivedValue(
      () =>
        Math.min(
          Math.max(anchorPoint.value.y + fontSize * 0.3, fontSize + 2),
          canvasHeight - 2,
        ),
      [anchorPoint, fontSize, canvasHeight],
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
