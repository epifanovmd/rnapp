import React, { FC, memo } from "react";

import { Col } from "../../flex-view";
import { Text } from "../../text";
import { ITouchableProps, Touchable } from "../../touchable";

export interface IChartLegendItemProps extends Omit<
  ITouchableProps,
  "children"
> {
  color: string;
  label: string;
  /** Серия скрыта: точка-контур, пункт приглушён. */
  hidden?: boolean;
}

/** Пункт легенды: цветная точка и подпись; с `onPress` — переключатель серии. */
export const ChartLegendItem: FC<IChartLegendItemProps> = memo(
  ({ color, label, hidden, onPress, disabled, ...rest }) => (
    <Touchable
      row
      alignItems={"center"}
      gap={6}
      hitSlop={6}
      opacity={hidden ? 0.5 : undefined}
      disabled={!onPress || disabled}
      onPress={onPress}
      accessibilityRole={onPress ? "checkbox" : undefined}
      accessibilityState={
        onPress ? { checked: !hidden, disabled: !!disabled } : undefined
      }
      {...rest}
    >
      <Col
        circle={8}
        bg={hidden ? undefined : color}
        borderWidth={hidden ? 1.5 : undefined}
        borderColor={hidden ? color : undefined}
      />
      <Text
        textStyle={"Caption_M3"}
        color={"textSecondary"}
        textDecorationLine={hidden ? "line-through" : undefined}
      >
        {label}
      </Text>
    </Touchable>
  ),
);
