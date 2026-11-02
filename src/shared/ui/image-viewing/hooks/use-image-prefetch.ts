import { useEffect } from "react";
import FastImage from "react-native-fast-image";

import { IImageViewingSource } from "../image-viewing.types";

/** Префетч соседних изображений активного индекса. */
export const useImagePrefetch = (
  images: ReadonlyArray<IImageViewingSource>,
  index: number,
  enabled: boolean,
) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const neighbors = [images[index - 1], images[index + 1]]
      .filter((image): image is IImageViewingSource => !!image)
      .map(image => ({ uri: image.uri }));

    if (neighbors.length > 0) {
      FastImage.preload(neighbors);
    }
  }, [images, index, enabled]);
};
