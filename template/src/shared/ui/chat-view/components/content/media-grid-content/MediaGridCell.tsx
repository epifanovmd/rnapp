import React, { FC, memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import FastImage from "react-native-fast-image";

import { IChatMediaItem } from "../../../data";
import { formatChatDuration } from "../../../utils";
import { useChatViewContext } from "../../chat-view-context";
import { ChatIcon } from "../../ChatIcon";
import { ChatText } from "../../ChatText";
import { IMediaGridFrame } from "./media-grid-layout";

/**
 * Ячейка сетки: превью, иконка воспроизведения и бейдж длительности у видео,
 * оверлей «+N» на последней ячейке.
 */

interface IMediaGridCellProps {
  item: IChatMediaItem;
  frame: IMediaGridFrame;
  index: number;
  /** Сколько вложений скрыто под оверлеем «+N»; 0 — оверлея нет. */
  remaining: number;
  onPress: (index: number) => void;
}

export const MediaGridCell: FC<IMediaGridCellProps> = memo(
  ({ item, frame, index, remaining, onPress }) => {
    const { theme, layout, styles } = useChatViewContext();

    const cellStyle = useMemo(
      () => ({
        position: "absolute" as const,
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
        backgroundColor: theme.mediaPlaceholderBackground,
      }),
      [frame, theme.mediaPlaceholderBackground],
    );

    const handlePress = useCallback(() => onPress(index), [onPress, index]);

    const showsVideoBadges = item.isVideo && remaining === 0;

    return (
      <Pressable style={cellStyle} onPress={handlePress}>
        {!!item.thumbnailUrl && (
          <FastImage
            style={StyleSheet.absoluteFill}
            source={{ uri: item.thumbnailUrl }}
            resizeMode={FastImage.resizeMode.cover}
          />
        )}

        {showsVideoBadges && (
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

        {showsVideoBadges && item.duration != null && (
          <View style={styles.shared.mediaDurationBadge}>
            <ChatText style={styles.shared.mediaDurationText}>
              {formatChatDuration(item.duration)}
            </ChatText>
          </View>
        )}

        {remaining > 0 && (
          <View style={styles.shared.mediaOverlay}>
            <ChatText
              style={styles.shared.mediaOverlayText}
            >{`+${remaining}`}</ChatText>
          </View>
        )}
      </Pressable>
    );
  },
);

MediaGridCell.displayName = "MediaGridCell";

const ss = StyleSheet.create({
  playIconWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  playIconShadow: { shadowOffset: { width: 0, height: 0 } },
});
