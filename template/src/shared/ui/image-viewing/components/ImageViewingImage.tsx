import React, { FC, memo, useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import FastImage, { OnLoadEvent } from "react-native-fast-image";

import { Touchable } from "../../touchable";
import { IImageViewingSource } from "../image-viewing.types";

export interface IImageViewingImageProps {
  image: IImageViewingSource;
  /** Натуральные размеры после загрузки (для точного клэмпа зума). */
  onDimensions?: (width: number, height: number) => void;
}

/** Изображение слайда: превью-миниатюра, индикатор загрузки, ошибка с повтором. */
export const ImageViewingImage: FC<IImageViewingImageProps> = memo(
  ({ image, onDimensions }) => {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    const handleLoad = useCallback(
      (event: OnLoadEvent) => {
        setLoaded(true);
        onDimensions?.(event.nativeEvent.width, event.nativeEvent.height);
      },
      [onDimensions],
    );

    const handleError = useCallback(() => setFailed(true), []);

    const handleRetry = useCallback(() => {
      setFailed(false);
      setAttempt(current => current + 1);
    }, []);

    return (
      <View style={styles.container}>
        {!!image.previewUri && !loaded && (
          <FastImage
            source={{ uri: image.previewUri }}
            style={StyleSheet.absoluteFill}
            resizeMode={"contain"}
          />
        )}
        {!failed && (
          <FastImage
            key={attempt}
            source={{ uri: image.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode={"contain"}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
        {!loaded && !failed && (
          <ActivityIndicator style={styles.center} color={"#FFFFFF"} />
        )}
        {failed && (
          <Touchable style={styles.center} onPress={handleRetry}>
            <Text style={styles.errorText}>
              Не удалось загрузить{"\n"}Нажмите, чтобы повторить
            </Text>
          </Touchable>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#FFFFFF",
    textAlign: "center",
  },
});
