import React, { FC, memo, useSyncExternalStore } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import { ChatOverlayStore } from "./chat-overlay-store";
import { useChatViewContext } from "./chat-view-context";

/**
 * Порт EmptyStateManager: заглушка пустого состояния (текст или спиннер
 * при isLoading), тап скрывает клавиатуру.
 */

const DEFAULT_EMPTY_TEXT = "Сообщений пока нет.\nНапишите первым!";

interface IEmptyStateOverlayProps {
  store: ChatOverlayStore;
}

export const EmptyStateOverlay: FC<IEmptyStateOverlayProps> = memo(
  ({ store }) => {
    const { theme, layout, features } = useChatViewContext();
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot);

    if (!features.showEmptyState || !state.emptyVisible) return null;

    return (
      <Pressable style={ss.wrap} onPress={() => Keyboard.dismiss()}>
        {state.emptyLoading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Text
            style={[
              ss.text,
              {
                paddingHorizontal: layout.emptyStatePadding,
                fontSize: layout.emptyStateFont.fontSize,
                fontWeight: layout.emptyStateFont.fontWeight,
                color: theme.emptyStateText,
              },
            ]}
          >
            {state.emptyText ?? DEFAULT_EMPTY_TEXT}
          </Text>
        )}
      </Pressable>
    );
  },
);

EmptyStateOverlay.displayName = "EmptyStateOverlay";

const ss = StyleSheet.create({
  text: {
    textAlign: "center",
  },
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
