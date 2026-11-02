import { useMergedCallback } from "@shared/lib/hooks";
import React, { FC, memo, ReactNode } from "react";
import { ImageStyle, StyleSheet, View, ViewStyle } from "react-native";
import FastImage, { FastImageProps } from "react-native-fast-image";

import { FlexProps, useFlexProps } from "../flex-view";
import type { TIconName } from "../icon";
import { shouldRenderImage } from "./image-load-state";
import { ImageFallback } from "./ImageFallback";
import { ImageSkeleton } from "./ImageSkeleton";
import { useImageLoadState } from "./useImageLoadState";

export interface ImageProps
  extends
    FlexProps<ImageStyle>,
    // свой fallback выразительнее булевого у FastImage
    Omit<FastImageProps, "style" | "source" | "fallback"> {
  /** Адрес изображения; пустой или отсутствующий — сразу фолбэк. */
  url?: string;
  /** Полный source FastImage (headers, priority, require); главнее url. */
  source?: FastImageProps["source"];
  /**
   * Скелетон на время загрузки: true — стандартный пульс (по умолчанию),
   * false — без скелетона, ReactNode — свой (absolute-заполнение контейнера).
   */
  skeleton?: boolean | ReactNode;
  /** Фолбэк при ошибке/пустом источнике: как `skeleton`. */
  fallback?: boolean | ReactNode;
  /** Иконка стандартного фолбэка. */
  fallbackIcon?: TIconName;
  /** Слой поверх изображения (бейджи, градиенты) — для расширения. */
  children?: ReactNode;
}

/** true — стандартный оверлей, false — ничего, ReactNode — как есть. */
const resolveOverlay = (
  option: boolean | ReactNode,
  defaultNode: ReactNode,
): ReactNode => {
  if (option === true) return defaultNode;
  if (option === false) return null;

  return option;
};

/**
 * Изображение кита: FastImage + FlexProps-размеры/радиус, скелетон на время
 * загрузки и фолбэк при ошибке. Кастомизация — пропами `skeleton`/`fallback`
 * (свои ReactNode), расширение — экспортированными `useImageLoadState`,
 * `ImageSkeleton`, `ImageFallback` для собственных композиций.
 */
export const Image: FC<ImageProps> = memo(props => {
  const { style, ownProps } = useFlexProps(props);
  const {
    url,
    source,
    skeleton = true,
    fallback = true,
    fallbackIcon = "image",
    onLoad,
    onError,
    children,
    ...fastImageProps
  } = ownProps;

  const sourceKey =
    source == null ? url : typeof source === "number" ? source : source.uri;
  const load = useImageLoadState(sourceKey);
  const handleLoad = useMergedCallback(onLoad, load.handleLoad);
  const handleError = useMergedCallback(onError, load.handleError);

  return (
    <View style={[styles.container, style as ViewStyle]}>
      {shouldRenderImage(load.status) && (
        <FastImage
          style={StyleSheet.absoluteFill as FastImageProps["style"]}
          source={source ?? { uri: url }}
          onLoad={handleLoad}
          onError={handleError}
          {...fastImageProps}
        />
      )}
      {load.status === "loading" && resolveOverlay(skeleton, <ImageSkeleton />)}
      {load.status === "error" &&
        resolveOverlay(fallback, <ImageFallback icon={fallbackIcon} />)}
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
