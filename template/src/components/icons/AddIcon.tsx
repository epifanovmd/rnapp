import { useFlexProps } from "@force-dev/react-mobile";
import React, { FC } from "react";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "../../theme";
import { FlexSvgProps } from "./types";

interface IProps extends FlexSvgProps {}

export const AddIcon: FC<IProps> = ({
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
      <Path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
    </Svg>
  );
};
