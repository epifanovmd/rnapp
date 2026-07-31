import React, { FC, memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FastImage from "react-native-fast-image";

import {
  formatChatDuration,
  IChatMediaItem,
  IChatViewLayout,
} from "../../model";
import { useChatViewContext } from "../chat-view-context";
import { ChatIcon } from "../ChatIcon";

/**
 * Порт MediaGridView: сетка 1/2/3/4+ изображений и видео с оверлеем "+N",
 * иконкой воспроизведения и бейджем длительности.
 */

const MAX_VISIBLE = 4;

interface IFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Порт MediaGridView.gridHeight. */
export const mediaGridHeight = (
  media: IChatMediaItem[],
  width: number,
  layout: IChatViewLayout,
): number => {
  const count = media.length;

  if (count === 0) return 0;

  if (count === 1) {
    const item = media[0];

    if (item.width && item.height && item.width > 0) {
      const ratio = item.height / item.width;

      return Math.min(
        Math.max(width * ratio, layout.imageMinHeight),
        layout.imageMaxHeight,
      );
    }

    return layout.imageMinHeight;
  }

  return Math.min(width * 0.75, layout.imageMaxHeight);
};

/** Порт MediaGridView.layoutFrames. */
const layoutFrames = (
  count: number,
  width: number,
  height: number,
  s: number,
): IFrame[] => {
  switch (count) {
    case 1:
      return [{ x: 0, y: 0, width, height }];
    case 2: {
      const w = (width - s) / 2;

      return [
        { x: 0, y: 0, width: w, height },
        { x: w + s, y: 0, width: width - w - s, height },
      ];
    }
    case 3: {
      const leftW = ((width - s) * 2) / 3;
      const rightW = width - leftW - s;
      const rightH = (height - s) / 2;

      return [
        { x: 0, y: 0, width: leftW, height },
        { x: leftW + s, y: 0, width: rightW, height: rightH },
        {
          x: leftW + s,
          y: rightH + s,
          width: rightW,
          height: height - rightH - s,
        },
      ];
    }
    default: {
      const w = (width - s) / 2;
      const h = (height - s) / 2;

      return [
        { x: 0, y: 0, width: w, height: h },
        { x: w + s, y: 0, width: width - w - s, height: h },
        { x: 0, y: h + s, width: w, height: height - h - s },
        { x: w + s, y: h + s, width: width - w - s, height: height - h - s },
      ];
    }
  }
};

interface IMediaGridContentProps {
  messageId: string;
  media: IChatMediaItem[];
  width: number;
}

export const MediaGridContent: FC<IMediaGridContentProps> = memo(
  ({ messageId, media, width }) => {
    const { theme, layout, delegate } = useChatViewContext();

    const count = media.length;
    const visibleCount = Math.min(count, MAX_VISIBLE);
    const totalH = mediaGridHeight(media, width, layout);

    const frames = useMemo(
      () => layoutFrames(visibleCount, width, totalH, layout.mediaGridSpacing),
      [visibleCount, width, totalH, layout.mediaGridSpacing],
    );

    if (count === 0) return null;

    return (
      <View
        style={[
          ss.grid,
          { width, height: totalH, borderRadius: layout.imageCornerRadius },
        ]}
      >
        {media.slice(0, visibleCount).map((item, i) => {
          const frame = frames[i];
          const showOverlay = i === visibleCount - 1 && count > MAX_VISIBLE;

          return (
            <Pressable
              key={i}
              style={[
                ss.cell,
                {
                  left: frame.x,
                  top: frame.y,
                  width: frame.width,
                  height: frame.height,
                  backgroundColor: theme.mediaPlaceholderBackground,
                },
              ]}
              onPress={() => delegate.current?.onTapMessage(messageId, i)}
            >
              {!!item.thumbnailUrl && (
                <FastImage
                  style={StyleSheet.absoluteFill}
                  source={{ uri: item.thumbnailUrl }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              )}

              {item.isVideo && !showOverlay && (
                <View style={ss.playIconWrap}>
                  <View
                    style={[
                      ss.playIconShadow,
                      {
                        shadowColor: theme.mediaPlayShadowColor,
                        shadowOpacity: layout.mediaPlayShadowOpacity,
                        shadowRadius: layout.mediaPlayShadowRadius,
                      },
                    ]}
                  >
                    <ChatIcon
                      name="play.circle.fill"
                      size={layout.mediaPlayIconSize}
                      color={theme.mediaPlayIconColor}
                    />
                  </View>
                </View>
              )}

              {item.isVideo && item.duration != null && !showOverlay && (
                <View
                  style={[
                    ss.durationBadge,
                    {
                      right: layout.mediaDurationMargin,
                      bottom: layout.mediaDurationMargin,
                      borderRadius: layout.mediaDurationCornerRadius,
                      paddingHorizontal: layout.mediaDurationPadH,
                      paddingVertical: layout.mediaDurationPadV,
                      backgroundColor: theme.mediaDurationBackground,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: layout.mediaDurationFont.fontSize,
                      fontWeight: layout.mediaDurationFont.fontWeight,
                      fontVariant: ["tabular-nums"],
                      color: theme.mediaDurationTextColor,
                    }}
                  >
                    {formatChatDuration(item.duration)}
                  </Text>
                </View>
              )}

              {showOverlay && (
                <View
                  style={[
                    ss.overlay,
                    { backgroundColor: theme.mediaOverlayBackground },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: layout.mediaOverlayFont.fontSize,
                      fontWeight: layout.mediaOverlayFont.fontWeight,
                      color: theme.mediaOverlayTextColor,
                    }}
                  >
                    {`+${count - MAX_VISIBLE}`}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  },
);

MediaGridContent.displayName = "MediaGridContent";

const ss = StyleSheet.create({
  grid: {
    overflow: "hidden",
  },
  cell: {
    position: "absolute",
  },
  playIconWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  playIconShadow: {
    shadowOffset: { width: 0, height: 0 },
  },
  durationBadge: {
    position: "absolute",
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
