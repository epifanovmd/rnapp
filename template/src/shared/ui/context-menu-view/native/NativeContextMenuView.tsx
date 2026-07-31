import React, { FC } from "react";
import {
  type HostComponent,
  type NativeSyntheticEvent,
  Platform,
  requireNativeComponent,
  View,
} from "react-native";

import { IContextMenuViewProps } from "../types";
import type {
  NativeContextMenuActionSelectData,
  NativeContextMenuDismissData,
  NativeContextMenuEmojiSelectData,
  NativeContextMenuViewProps,
  NativeContextMenuWillShowData,
} from "./NativeContextMenuViewSpec";

const COMPONENT_NAME = "RNContextMenuView";

const RNContextMenuView = (() => {
  try {
    const spec = require("./NativeContextMenuViewSpec").default;

    return spec as HostComponent<NativeContextMenuViewProps>;
  } catch {
    return requireNativeComponent<NativeContextMenuViewProps>(COMPONENT_NAME);
  }
})();

export const NativeContextMenuView: FC<IContextMenuViewProps> = ({
  menuId = "",
  emojis = [],
  actions = [],
  theme = "light",
  minimumPressDuration = 0.35,
  style,
  children,
  onWillShow,
  onEmojiSelect,
  onActionSelect,
  onDismiss,
}) => {
  if (Platform.OS !== "ios") {
    return <View style={style}>{children}</View>;
  }

  const handleWillShow = (
    e: NativeSyntheticEvent<NativeContextMenuWillShowData>,
  ) => onWillShow?.({ menuId: e.nativeEvent.menuId });

  const handleEmojiSelect = (
    e: NativeSyntheticEvent<NativeContextMenuEmojiSelectData>,
  ) =>
    onEmojiSelect?.({
      emoji: e.nativeEvent.emoji,
      menuId: e.nativeEvent.menuId,
    });

  const handleActionSelect = (
    e: NativeSyntheticEvent<NativeContextMenuActionSelectData>,
  ) =>
    onActionSelect?.({
      actionId: e.nativeEvent.actionId,
      menuId: e.nativeEvent.menuId,
    });

  const handleDismiss = (
    e: NativeSyntheticEvent<NativeContextMenuDismissData>,
  ) => onDismiss?.({ menuId: e.nativeEvent.menuId });

  return (
    <RNContextMenuView
      style={style}
      menuId={menuId}
      emojis={emojis}
      actions={actions}
      theme={theme}
      minimumPressDuration={minimumPressDuration}
      onWillShow={handleWillShow}
      onEmojiSelect={handleEmojiSelect}
      onActionSelect={handleActionSelect}
      onDismiss={handleDismiss}
    >
      {children}
    </RNContextMenuView>
  );
};
