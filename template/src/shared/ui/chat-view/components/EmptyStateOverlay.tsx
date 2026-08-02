import React, { FC, memo, useCallback } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import { useChatViewContext } from "./chat-view-context";

/**
 * Пустое состояние: текст или спиннер при загрузке, тап скрывает клавиатуру.
 *
 * Состояние приходит пропами напрямую из пропов чата — внешний стор для трёх
 * значений, меняющихся дважды за жизнь экрана, был лишним.
 */
const DEFAULT_EMPTY_TEXT = "Сообщений пока нет.\nНапишите первым!";

interface IEmptyStateOverlayProps {
  visible: boolean;
  loading: boolean;
  text?: string;
}

export const EmptyStateOverlay: FC<IEmptyStateOverlayProps> = memo(
  ({ visible, loading, text }) => {
    const { features, styles } = useChatViewContext();

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
