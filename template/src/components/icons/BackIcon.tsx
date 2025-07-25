import { useFlexProps } from "@force-dev/react-mobile";
import React, { FC } from "react";
import Svg, { G, Path } from "react-native-svg";

import { useTheme } from "../../theme";
import { FlexSvgProps } from "./types";

interface IProps extends FlexSvgProps {}

export const BackIcon: FC<IProps> = ({
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

  console.log("text", text);

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
      <G fill="none">
        <Path d="M0 0h24v24H0z" />
        <Path
          fill={ownProps.fill || text}
          fillRule="nonzero"
          d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z"
        />
      </G>
    </Svg>
  );
};
