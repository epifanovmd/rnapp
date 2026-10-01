import { TColorTheme, useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";

import { Icon, TIconName } from "../icon";
import { ITouchableProps, Touchable } from "../touchable";

const HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

export interface IIconButtonProps extends Omit<ITouchableProps, "children"> {
  name: TIconName;
  /** Подпись для скринридера — у кнопки нет текста. */
  accessibilityLabel: string;
  size?: number;
  /** Токен темы или произвольный цвет; по умолчанию textPrimary. */
  color?: keyof TColorTheme | string;
}

/** Кнопка-иконка без подписи: действия в шапке, строке, карточке. */
export const IconButton: FC<IIconButtonProps> = memo(
  ({ name, size = 22, color, disabled, ...rest }) => {
    const { colors } = useTheme();
    const tint =
      color === undefined
        ? colors.textPrimary
        : (colors[color as keyof TColorTheme] ?? color);

    return (
      <Touchable
        hitSlop={HIT_SLOP}
        accessibilityRole={"button"}
        disabled={disabled}
        opacity={disabled ? 0.4 : undefined}
        {...rest}
      >
        <Icon name={name} size={size} color={tint} />
      </Touchable>
    );
  },
);
