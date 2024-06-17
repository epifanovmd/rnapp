import { useFlexProps } from "@force-dev/react-mobile";
import React, { FC } from "react";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "../../theme";
import { FlexSvgProps } from "./types";

export const CheckBoldIcon: FC<FlexSvgProps> = ({
  height = 24,
  width = 24,
  scale,
  opacity,
  translateY,
  translateX,
  color,
  fontSize,
  fontFamily,
  fontStyle,
  fontWeight,
  letterSpacing,
  ...rest
}) => {
  const { style, ownProps } = useFlexProps(rest);
  const {
    theme: {
      color: { text },
    },
  } = useTheme();

  return (
    <Svg
      viewBox="0 0 24 24"
      height={height}
      width={width}
      scale={scale}
      opacity={opacity}
      translateY={translateY}
      translateX={translateX}
      color={color}
      fontSize={fontSize}
      fontFamily={fontFamily}
      fontStyle={fontStyle}
      fontWeight={fontWeight}
      letterSpacing={letterSpacing}
      style={style}
      {...ownProps}
      fill={ownProps?.fill || color || text}
    >
      <Path d="M9.00004 20.4199L2.79004 14.2099L5.62004 11.3799L9.00004 14.7699L18.88 4.87988L21.71 7.70988L9.00004 20.4199Z" />
    </Svg>
  );
};
