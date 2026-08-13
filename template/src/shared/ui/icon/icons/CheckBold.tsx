import React, { FC } from "react";
import Svg, { Path } from "react-native-svg";

import { IIconGlyphProps } from "../icon.types";

/**
 * Пример кастомной иконки для реестра (`icon-registry.ts`): реализует
 * lucide-совместимый контракт `IIconGlyphProps` — size и color.
 */
export const CheckBoldIcon: FC<IIconGlyphProps> = ({
  size = 24,
  color = "currentColor",
  ...rest
}) => (
  <Svg viewBox={"0 0 24 24"} width={size} height={size} {...rest}>
    <Path
      fill={color}
      d="M9.00004 20.4199L2.79004 14.2099L5.62004 11.3799L9.00004 14.7699L18.88 4.87988L21.71 7.70988L9.00004 20.4199Z"
    />
  </Svg>
);
