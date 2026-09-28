import React, { FC, memo, useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { SharedValue } from "react-native-reanimated";

import { useViewerGestures } from "../hooks/use-viewer-gestures";
import {
  IImageViewingConfig,
  IImageViewingSource,
} from "../image-viewing.types";
import { ImageViewingImage } from "./ImageViewingImage";

export interface IImageViewingItemProps {
  image: IImageViewingSource;
  index: number;
  /** Слайд в фокусе пейджера; уход с него сбрасывает зум. */
  isActive: boolean;
  width: number;
  height: number;
  config: IImageViewingConfig;
  dismissProgress: SharedValue<number>;
  renderImage?: (image: IImageViewingSource, index: number) => React.ReactNode;
  onZoomChange: (zoomed: boolean) => void;
  onSingleTap: () => void;
  onLongPress?: (image: IImageViewingSource, index: number) => void;
  onDismiss: () => void;
}

/** Contain-fit размеры контента в контейнере (для клэмпа границ пана). */
const fitContent = (
  imageWidth: number | undefined,
  imageHeight: number | undefined,
  containerWidth: number,
  containerHeight: number,
) => {
  if (!imageWidth || !imageHeight) {
    return { width: containerWidth, height: containerHeight };
  }

  const scale = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight,
  );

  return { width: imageWidth * scale, height: imageHeight * scale };
};

/** Один слайд вьюера: жестовая оболочка вокруг контента. */
export const ImageViewingItem: FC<IImageViewingItemProps> = memo(
  ({
    image,
    index,
    isActive,
    width,
    height,
    config,
    dismissProgress,
    renderImage,
    onZoomChange,
    onSingleTap,
    onLongPress,
    onDismiss,
  }) => {
    const [dimensions, setDimensions] = useState({
      width: image.width,
      height: image.height,
    });

    const content = fitContent(
      dimensions.width,
      dimensions.height,
      width,
      height,
    );

    const handleDimensions = useCallback(
      (imageWidth: number, imageHeight: number) => {
        setDimensions(current =>
          current.width === imageWidth && current.height === imageHeight
            ? current
            : { width: imageWidth, height: imageHeight },
        );
      },
      [],
    );

    const handleZoomChange = useCallback(
      (zoomed: boolean) => {
        if (isActive) {
          onZoomChange(zoomed);
        }
      },
      [isActive, onZoomChange],
    );

    const handleLongPress = useCallback(
      () => onLongPress?.(image, index),
      [onLongPress, image, index],
    );

    const { gesture, animatedStyle, reset } = useViewerGestures({
      containerWidth: width,
      containerHeight: height,
      contentWidth: content.width,
      contentHeight: content.height,
      maxScale: config.maxScale,
      doubleTapScale: config.doubleTapScale,
      swipeToCloseEnabled: config.swipeToCloseEnabled,
      doubleTapToZoomEnabled: config.doubleTapToZoomEnabled,
      dismissProgress,
      onZoomChange: handleZoomChange,
      onSingleTap,
      onLongPress: onLongPress ? handleLongPress : undefined,
      onDismiss,
    });

    useEffect(() => {
      if (!isActive) {
        reset();
      }
    }, [isActive, reset]);

    return (
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ width, height }, styles.item]}>
          <Animated.View style={[styles.fill, animatedStyle]}>
            {renderImage ? (
              renderImage(image, index)
            ) : (
              <ImageViewingImage
                image={image}
                onDimensions={handleDimensions}
              />
            )}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    );
  },
);

const styles = StyleSheet.create({
  item: {
    overflow: "hidden",
  },
  fill: {
    flex: 1,
  },
});
