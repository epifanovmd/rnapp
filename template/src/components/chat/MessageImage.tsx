import { useBoolean } from "@force-dev/react";
import { ImageViewing, ImageViewingProps } from "@force-dev/react-mobile";
import React, { forwardRef, memo, useMemo } from "react";
import {
  Image,
  ImageProps,
  ImageStyle,
  ImageURISource,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

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
        imageViewingProps,
        imageProps = {},
        imageSourceProps = {},
        imageStyle,
        currentMessage,
      },
      ref,
    ) => {
      const [open, onOpen, onClose] = useBoolean();

      const _images = useMemo(
        () => [{ uri: currentMessage?.image?.url }],
        [currentMessage?.image],
      );

      const source = useMemo(
        () => ({ ...imageSourceProps, uri: currentMessage?.image?.url }),
        [currentMessage?.image, imageSourceProps],
      );

      if (currentMessage == null) {
        return null;
      }

      return (
        <View style={[styles.container, containerStyle]}>
          <ImageViewing
            {...imageViewingProps}
            images={_images}
            imageIndex={0}
            visible={open}
            onRequestClose={onClose}
          />
          <TouchableOpacity onPress={onOpen}>
            <Image
              ref={ref}
              {...imageProps}
              style={[styles.image, imageStyle]}
              source={source}
            />
          </TouchableOpacity>
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
