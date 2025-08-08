import React, { FC } from "react";
import Svg, { G, Path, SvgProps } from "react-native-svg";

export const BackIcon: FC<SvgProps> = props => {
  return (
    <Svg viewBox="0 0 24 24" {...props} fill={props.fill || props.color}>
      <G fill="none">
        <Path d="M0 0h24v24H0z" />
        <Path
          fill={props.fill || props.color}
          fillRule="nonzero"
          d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z"
        />
      </G>
    </Svg>
  );
};
