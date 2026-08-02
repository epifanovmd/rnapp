import React, { FC, memo, useSyncExternalStore } from "react";
import { StyleSheet, View } from "react-native";
import { SharedValue, useAnimatedReaction } from "react-native-reanimated";

import { ChatAvatarStore } from "../chat-avatar-store";
import { useChatViewContext } from "../chat-view-context";
import { StickyAvatarView } from "./StickyAvatarView";

/**
 * Слой sticky-аватаров поверх списка.
 *
 * Аватары рисуются вне ячеек: они должны прилипать к низу видимой области, а
 * элемент списка так двигаться не может. Слой перерисовывается только когда
 * меняется состав групп на экране.
 *
 * Позиция каждого аватара считается на UI-потоке из `scrollY` + границ группы
 * (`top`/`bottom`): JS-поток лишь меняет состав и границы, поэтому аватары
 * едут за списком без лага и ре-рендеров.
 */

interface IChatAvatarLayerProps {
  store: ChatAvatarStore;
  /** Позиция скролла — обновляется на UI-потоке. */
  scrollY: SharedValue<number>;
  /** Высота вьюпорта списка. */
  viewportHeight: SharedValue<number>;
  /** Перекрытие снизу: панель ввода и клавиатура. */
  bottomInset: SharedValue<number>;
}

export const ChatAvatarLayer: FC<IChatAvatarLayerProps> = memo(
  ({ store, scrollY, viewportHeight, bottomInset }) => {
    const { layout, features } = useChatViewContext();
    const slots = useSyncExternalStore(store.subscribe, store.getSlots);
    const avatarSize = layout.avatarSize;

    // natural → sticky → ceiling от живого скролла; границы групп статичны.
    useAnimatedReaction(
      () => [scrollY.value, viewportHeight.value, bottomInset.value],
      ([sy, viewport, inset]) => {
        for (let i = 0; i < slots.length; i++) {
          const slot = slots[i];
          const sticky = Math.min(
            slot.bottom.value - avatarSize,
            sy + viewport - inset - avatarSize,
          );

          slot.y.value = Math.max(sticky, slot.top.value) - sy;
        }
      },
      [slots, avatarSize],
    );

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
  },
);

ChatAvatarLayer.displayName = "ChatAvatarLayer";
