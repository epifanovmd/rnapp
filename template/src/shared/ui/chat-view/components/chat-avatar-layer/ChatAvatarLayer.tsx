import React, { FC, memo, useSyncExternalStore } from "react";
import { StyleSheet, View } from "react-native";

import { ChatAvatarStore } from "../chat-avatar-store";
import { useChatViewContext } from "../chat-view-context";
import { StickyAvatarView } from "./StickyAvatarView";

/**
 * Слой sticky-аватаров поверх списка — порт `AvatarSupplementaryView`.
 *
 * Аватары рисуются вне ячеек: они должны прилипать к низу видимой области, а
 * элемент списка так двигаться не может. Слой перерисовывается только когда
 * меняется состав групп на экране.
 */

interface IChatAvatarLayerProps {
  store: ChatAvatarStore;
}

export const ChatAvatarLayer: FC<IChatAvatarLayerProps> = memo(({ store }) => {
  const { layout, features } = useChatViewContext();
  const slots = useSyncExternalStore(store.subscribe, store.getSlots);

  if (!features.showAvatars || slots.length === 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {slots.map(slot => (
        <StickyAvatarView
          key={slot.key}
          y={slot.y}
          name={slot.senderName}
          url={slot.senderAvatarUrl}
          size={layout.avatarSize}
          left={layout.avatarLeadingMargin}
        />
      ))}
    </View>
  );
});

ChatAvatarLayer.displayName = "ChatAvatarLayer";
