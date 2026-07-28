import React, { FC } from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

export const CloseIcon: FC<SvgProps> = props => {
  return (
    <Svg viewBox="0 0 24 24" {...props} fill={props.fill || props.color}>
      <Path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" />
    </Svg>
  );
};
