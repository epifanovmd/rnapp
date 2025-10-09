import React, { forwardRef, memo } from "react";
import {
  Image,
  ImageProps,
  ImageStyle,
  ImageURISource,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { ImageViewingProps } from "../imageViewing";
import { IMessage } from "./types";

export interface MessageImageProps {
  currentMessage?: IMessage;
  containerStyle?: StyleProp<ViewStyle>;
  imageSourceProps?: Partial<ImageURISource>;
  imageStyle?: StyleProp<ImageStyle>;
  imageProps?: Partial<ImageProps>;
  imageViewingProps?: ImageViewingProps;
}

export const MessageImage = memo(
  forwardRef<Image, MessageImageProps>(
    (
      {
        containerStyle,
        imageProps = {},
        imageSourceProps = {},
        imageStyle,
        currentMessage,
      },
      ref,
    ) => {
      if (currentMessage == null) {
        return null;
      }

      return (
        <View style={[styles.container, containerStyle]}>
          <Image
            ref={ref}
            {...imageProps}
            style={[styles.image, imageStyle]}
            source={{ ...imageSourceProps, uri: currentMessage?.image?.url }}
          />
        </View>
      );
    },
  ),
);

const styles = StyleSheet.create({
  container: {},
  image: {
    width: 150,
    height: 100,
    borderRadius: 13,
    margin: 8,
    resizeMode: "cover",
  },
  imageActive: {
    flex: 1,
    resizeMode: "contain",
  },
});
