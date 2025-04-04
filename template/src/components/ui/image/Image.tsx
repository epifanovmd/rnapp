import { FlexProps, useFlexProps } from "@force-dev/react-mobile";
import React, { FC, memo, useMemo } from "react";
import { Animated, ImageStyle } from "react-native";
import FastImage, { FastImageProps } from "react-native-fast-image";

import { toAbsoluteUrl } from "~@api";
import createAnimatedComponent = Animated.createAnimatedComponent;

export interface ImageProps
  extends FlexProps<ImageStyle>,
    Omit<FastImageProps, "style" | "source"> {
  url: string;
}

const AnimatedFastImage = createAnimatedComponent(FastImage);

export const Image: FC<ImageProps> = memo(props => {
  const { style, ownProps, animated } = useFlexProps(props);

  const url = useMemo(() => {
    return { uri: toAbsoluteUrl(props.url) };
  }, [props.url]);

  const Component = animated ? AnimatedFastImage : FastImage;

  return <Component style={style as any} source={url} {...ownProps} />;
});
