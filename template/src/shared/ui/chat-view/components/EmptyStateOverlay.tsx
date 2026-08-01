import React, { FC, memo } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import { chatTextBase } from "../model";
import { ChatOverlayStore, IChatOverlayState } from "./chat-overlay-store";
import { useChatViewContext } from "./chat-view-context";
import { useOverlayValue } from "./useOverlayValue";

/**
 * Порт EmptyStateManager: заглушка пустого состояния (текст или спиннер
 * при isLoading), тап скрывает клавиатуру.
 */

const DEFAULT_EMPTY_TEXT = "Сообщений пока нет.\nНапишите первым!";

interface IEmptyStateOverlayProps {
  store: ChatOverlayStore;
}

const selectVisible = (state: IChatOverlayState) => state.emptyVisible;
const selectLoading = (state: IChatOverlayState) => state.emptyLoading;
const selectText = (state: IChatOverlayState) => state.emptyText;

export const EmptyStateOverlay: FC<IEmptyStateOverlayProps> = memo(
  ({ store }) => {
    const { theme, layout, features } = useChatViewContext();
    const visible = useOverlayValue(store, selectVisible);
    const loading = useOverlayValue(store, selectLoading);
    const text = useOverlayValue(store, selectText);

    if (!features.showEmptyState || !visible) return null;

    return (
      <Pressable style={ss.wrap} onPress={() => Keyboard.dismiss()}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Text
            style={[
              chatTextBase,
              ss.text,
              {
                paddingHorizontal: layout.emptyStatePadding,
                fontSize: layout.emptyStateFont.fontSize,
                fontWeight: layout.emptyStateFont.fontWeight,
                color: theme.emptyStateText,
              },
            ]}
          >
            {text ?? DEFAULT_EMPTY_TEXT}
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
