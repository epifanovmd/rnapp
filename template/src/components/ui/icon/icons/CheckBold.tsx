import React, { FC } from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

export const CheckBoldIcon: FC<SvgProps> = props => {
  return (
    <Svg viewBox="0 0 24 24" {...props} fill={props.fill || props.color}>
      <Path d="M9.00004 20.4199L2.79004 14.2099L5.62004 11.3799L9.00004 14.7699L18.88 4.87988L21.71 7.70988L9.00004 20.4199Z" />
    </Svg>
  );
};
