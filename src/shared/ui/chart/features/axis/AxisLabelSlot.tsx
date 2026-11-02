import { Group, RoundedRect, Text } from "@shopify/react-native-skia";
import React, { FC } from "react";
import {
  DerivedValue,
  SharedValue,
  useDerivedValue,
} from "react-native-reanimated";

import { isInScaleRange, LinearScale, scaleToRange, SkFont } from "../../core";
import type { AxisLabels } from "./useAxisLabels";

/** Позиция подписи: верхний левый угол текста-базовой линии по пикселю деления и ширине текста. */
export type AxisLabelPlacer = (
  pixel: number,
  width: number,
) => { x: number; y: number };

interface AxisLabelSlotProps {
  index: number;
  labels: SharedValue<AxisLabels>;
  scale: DerivedValue<LinearScale>;
  place: AxisLabelPlacer;
  font: SkFont;
  fontSize: number;
  color: string;
  background?: string;
}

interface SlotState {
  x: number;
  y: number;
  width: number;
  text: string;
  opacity: number;
}

const HIDDEN: SlotState = { x: 0, y: 0, width: 0, text: "", opacity: 0 };

/** Одна подпись из пула: своё деление по индексу, позиция и текст — на UI-потоке. */
export const AxisLabelSlot: FC<AxisLabelSlotProps> = ({
  index,
  labels,
  scale,
  place,
  font,
  fontSize,
  color,
  background,
}) => {
  const state = useDerivedValue<SlotState>(() => {
    const current = labels.value;
    const value = current.values[index];

    if (value === undefined) {
      return HIDDEN;
    }

    const pixel = scaleToRange(scale.value, value);

    if (!isInScaleRange(scale.value, pixel, 0.5)) {
      return HIDDEN;
    }

    const width = current.widths[index] ?? 0;
    const position = place(pixel, width);

    return {
      x: position.x,
      y: position.y,
      width,
      text: current.texts[index] ?? "",
      opacity: 1,
    };
  }, [labels, scale, index, place]);

  const x = useDerivedValue(() => state.value.x, [state]);
  const y = useDerivedValue(() => state.value.y, [state]);
  const text = useDerivedValue(() => state.value.text, [state]);
  const opacity = useDerivedValue(() => state.value.opacity, [state]);
  const backgroundX = useDerivedValue(() => state.value.x - 4, [state]);
  const backgroundY = useDerivedValue(
    () => state.value.y - fontSize - 1,
    [state, fontSize],
  );
  const backgroundWidth = useDerivedValue(() => state.value.width + 8, [state]);

  return (
    <Group opacity={opacity}>
      {background && (
        <RoundedRect
          x={backgroundX}
          y={backgroundY}
          width={backgroundWidth}
          height={fontSize + 6}
          r={3}
          color={background}
        />
      )}
      <Text x={x} y={y} text={text} font={font} color={color} />
    </Group>
  );
};
