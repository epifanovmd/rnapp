import React, { FC, memo, useCallback, useMemo } from "react";
import { View } from "react-native";

import { IChatContentProps, IChatImagesContent } from "../../../content";
import { useChatViewContext } from "../../../model";
import {
  MEDIA_GRID_MAX_VISIBLE,
  mediaGridFrames,
  mediaGridHeight,
} from "./media-grid-layout";
import { MediaGridCell } from "./MediaGridCell";

/**
 * Сетка вложений: 1/2/3/4+ изображений и видео с оверлеем «+N» на последней
 * ячейке.
 */

export const MediaGridContent: FC<IChatContentProps<IChatImagesContent>> = memo(
  ({ content, innerWidth: width, emit }) => {
    const { layout, styles } = useChatViewContext();

    const media = content.items;
    const count = media.length;
    const visibleCount = Math.min(count, MEDIA_GRID_MAX_VISIBLE);
    const totalHeight = mediaGridHeight(media, width, layout);

    const frames = useMemo(
      () =>
        mediaGridFrames(
          visibleCount,
          width,
          totalHeight,
          layout.mediaGridSpacing,
        ),
      [visibleCount, width, totalHeight, layout.mediaGridSpacing],
    );

    const gridStyle = useMemo(
      () => [styles.shared.mediaGrid, { width, height: totalHeight }],
      [styles.shared.mediaGrid, width, totalHeight],
    );

    const handlePress = useCallback(
      (index: number) => emit("builtin.media.tap", { index }),
      [emit],
    );

    if (count === 0) return null;

    return (
      <View style={gridStyle}>
        {media.slice(0, visibleCount).map((item, i) => (
          <MediaGridCell
            key={`${item.url}_${i}`}
            item={item}
            frame={frames[i]}
            index={i}
            remaining={
              i === visibleCount - 1 && count > MEDIA_GRID_MAX_VISIBLE
                ? count - MEDIA_GRID_MAX_VISIBLE
                : 0
            }
            onPress={handlePress}
          />
        ))}
      </View>
    );
  },
);

MediaGridContent.displayName = "MediaGridContent";
