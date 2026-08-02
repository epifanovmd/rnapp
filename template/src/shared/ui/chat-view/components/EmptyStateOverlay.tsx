import React, { FC, memo, useCallback } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import { ChatOverlayStore, IChatOverlayState } from "./chat-overlay-store";
import { useChatViewContext } from "./chat-view-context";
import { useOverlayValue } from "./useOverlayValue";

/**
 * Пустое состояние — порт `EmptyStateManager`: текст или спиннер при
 * `isLoading`, тап скрывает клавиатуру.
 */

const DEFAULT_EMPTY_TEXT = "Сообщений пока нет.\nНапишите первым!";

const selectVisible = (state: IChatOverlayState) => state.emptyVisible;
const selectLoading = (state: IChatOverlayState) => state.emptyLoading;
const selectText = (state: IChatOverlayState) => state.emptyText;

interface IEmptyStateOverlayProps {
  store: ChatOverlayStore;
}

export const EmptyStateOverlay: FC<IEmptyStateOverlayProps> = memo(
  ({ store }) => {
    const { features, styles } = useChatViewContext();

    const visible = useOverlayValue(store, selectVisible);
    const loading = useOverlayValue(store, selectLoading);
    const text = useOverlayValue(store, selectText);

    const handlePress = useCallback(() => Keyboard.dismiss(), []);

    if (!features.showEmptyState || !visible) return null;

    return (
      <Pressable style={ss.wrap} onPress={handlePress}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Text style={styles.shared.emptyStateText}>
            {text ?? DEFAULT_EMPTY_TEXT}
          </Text>
        )}
      </Pressable>
    );
  },
);

EmptyStateOverlay.displayName = "EmptyStateOverlay";

const ss = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
