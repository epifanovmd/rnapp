import React, { FC, memo, useCallback, useMemo } from "react";
import { View } from "react-native";

import { IChatMediaItem } from "../../../data";
import { useChatViewContext } from "../../chat-view-context";
import {
  MEDIA_GRID_MAX_VISIBLE,
  mediaGridFrames,
  mediaGridHeight,
} from "./media-grid-layout";
import { MediaGridCell } from "./MediaGridCell";

/**
 * Сетка вложений — порт `MediaGridView`: 1/2/3/4+ изображений и видео с
 * оверлеем «+N» на последней ячейке.
 */

interface IMediaGridContentProps {
  messageId: string;
  media: IChatMediaItem[];
  width: number;
}

export const MediaGridContent: FC<IMediaGridContentProps> = memo(
  ({ messageId, media, width }) => {
    const { layout, styles, delegate } = useChatViewContext();

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
      (index: number) => delegate.current?.onTapMessage(messageId, index),
      [delegate, messageId],
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
