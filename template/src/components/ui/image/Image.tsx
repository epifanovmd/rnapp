import React, { FC, memo } from "react";
import { ImageStyle } from "react-native";
import FastImage, { FastImageProps } from "react-native-fast-image";

import { FlexProps, useFlexProps } from "../../flexView";

export interface ImageProps
  extends FlexProps<ImageStyle>,
    Omit<FastImageProps, "style" | "source"> {
  url: string;
}

export const Image: FC<ImageProps> = memo(props => {
  const { style, ownProps } = useFlexProps(props);

  return (
    <FastImage style={style as any} source={{ uri: props.url }} {...ownProps} />
  );
});
