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
    labelSide = "out",
    canvasWidth,
    canvasHeight,
    text,
    font,
    fontSize,
    background,
    textColor,
  }: CrosshairXLabelProps) => {
    const metrics = useMemo(() => font.measureText(text), [font, text]);
    const boxWidth = metrics.width + LABEL_PADDING_X * 2;
    const boxHeight = fontSize + LABEL_PADDING_Y * 2;
    const isIn = labelSide === "in";
    const rawY =
      position === "top"
        ? isIn
          ? edgeY + LABEL_GAP
          : edgeY - boxHeight - LABEL_GAP
        : isIn
          ? edgeY - boxHeight - LABEL_GAP
          : edgeY + LABEL_GAP;
    const boxY = Math.min(
      Math.max(rawY, 0),
      Math.max(canvasHeight - boxHeight, 0),
    );

    const maxLeft = Math.max(0, canvasWidth - boxWidth);

    const boxX = useDerivedValue(
      () => Math.min(Math.max(anchorX.value - boxWidth / 2, 0), maxLeft),
      [anchorX, boxWidth, maxLeft],
    );

    const textX = useDerivedValue(
      () =>
        Math.min(Math.max(anchorX.value - metrics.width / 2, 4), maxLeft + 4),
      [anchorX, metrics, maxLeft],
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
          y={
            boxY +
            boxHeight -
            LABEL_PADDING_Y -
            fontSize * 0.22 /* Визуальное центрирование текста в чипе */
          }
          text={text}
          font={font}
          color={textColor}
        />
      </Group>
    );
  },
);
