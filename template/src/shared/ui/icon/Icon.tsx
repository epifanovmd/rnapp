import { useTheme } from "@shared/lib/theme";
import { FC, memo } from "react";
import { ColorValue } from "react-native";

import { FlexProps, useFlexProps } from "../flex-view";
import { ICONS_MAP, TIconName } from "./icon-registry";

type TOmitFlexPropsKeys =
  "width" | "height" | "opacity" | "scale" | "translateY" | "translateX";

type TIconFlexProps = Omit<FlexProps, TOmitFlexPropsKeys>;

export interface IIconProps extends TIconFlexProps {
  name: TIconName;
  /** Квадратный размер, px. */
  size?: number;
  /** Цвет; по умолчанию textPrimary темы. */
  color?: ColorValue;
  /** Толщина обводки lucide-иконок. */
  strokeWidth?: number;
  /** @deprecated Используй `size`. */
  width?: number;
  /** @deprecated Используй `size`. */
  height?: number;
}

/** Иконка из реестра (lucide + кастомные): `<Icon name="search" size={20} />`. */
export const Icon: FC<IIconProps> = memo(
  ({ name, size, width, height, color, strokeWidth, ...rest }) => {
    const { style, ownProps } = useFlexProps(rest);
    const { colors } = useTheme();

    const Component = ICONS_MAP[name];

    if (!Component) {
      return null;
    }

    return (
      <Component
        size={size ?? width ?? height ?? 24}
        color={color ?? colors.textPrimary}
        strokeWidth={strokeWidth}
        style={style}
        {...ownProps}
      />
    );
  },
);
