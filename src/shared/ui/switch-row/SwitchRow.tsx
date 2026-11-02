import { useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";

import { Col } from "../flex-view";
import { Icon, TIconName } from "../icon";
import { ISwitchProps, Switch } from "../switch";
import { Text } from "../text";
import { ITouchableProps, Touchable } from "../touchable";

export interface ISwitchRowProps extends Omit<
  ITouchableProps,
  "children" | "onPress"
> {
  label?: string;
  description?: string;
  icon?: TIconName;
  iconColor?: string;
  value: boolean;
  /** Переключение — по тумблеру и по нажатию на всю строку. */
  onValueChange: (value: boolean) => void | Promise<unknown>;
  /** Пропсы тумблера (loading, duration, ...). */
  switchProps?: Omit<
    ISwitchProps,
    "children" | "isActive" | "onChange" | "disabled"
  >;
}

/**
 * Строка настроек с тумблером: иконка, подпись и описание слева, тумблер
 * справа. Фон и горизонтальные отступы — у контейнера (или flex-пропсами).
 */
export const SwitchRow: FC<ISwitchRowProps> = memo(
  ({
    label,
    description,
    icon,
    iconColor,
    value,
    onValueChange,
    disabled,
    switchProps,
    ...rest
  }) => {
    const { colors } = useTheme();

    return (
      <Touchable
        row
        alignItems={"center"}
        gap={12}
        pv={10}
        disabled={disabled}
        opacity={disabled ? 0.6 : undefined}
        onPress={() => onValueChange(!value)}
        accessibilityRole={"switch"}
        accessibilityState={{ checked: value, disabled: !!disabled }}
        {...rest}
      >
        {!!icon && (
          <Icon
            name={icon}
            size={18}
            color={iconColor ?? colors.textSecondary}
          />
        )}
        <Col flex={1} gap={2}>
          {!!label && <Text textStyle={"Body_M2"}>{label}</Text>}
          {!!description && (
            <Text textStyle={"Caption_M3"} color={"textSecondary"}>
              {description}
            </Text>
          )}
        </Col>
        <Switch
          {...switchProps}
          accessibilityLabel={label}
          disabled={disabled}
          isActive={value}
          onChange={onValueChange}
        />
      </Touchable>
    );
  },
);
