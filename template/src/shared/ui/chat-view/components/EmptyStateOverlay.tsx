import React, { FC, memo, useCallback } from "react";
import { ActivityIndicator, Keyboard, StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useChatViewContext } from "./chat-view-context";
import { ChatText } from "./ChatText";

/**
 * Пустое состояние: текст или спиннер при загрузке, тап скрывает клавиатуру.
 *
 * Состояние приходит пропами напрямую из пропов чата — внешний стор для трёх
 * значений, меняющихся дважды за жизнь экрана, был лишним.
 *
 * Центрируется по **видимой** области, а не по всей высоте чата: снизу её
 * ограничивает панель ввода (и клавиатура, когда открыта). Нижняя зона у нас —
 * распорка в конце контента, отдельным вью её не видно, поэтому оверлей
 * поджимается тем же `contentInset`, что двигает панель. Иначе надпись
 * оказывается ниже центра ровно на половину этой зоны.
 */
const DEFAULT_EMPTY_TEXT = "Сообщений пока нет.\nНапишите первым!";

interface IEmptyStateOverlayProps {
  visible: boolean;
  loading: boolean;
  text?: string;
  /** Перекрытие снизу: панель ввода + клавиатура + отступы. */
  bottomInset: SharedValue<number>;
}

export const EmptyStateOverlay: FC<IEmptyStateOverlayProps> = memo(
  ({ visible, loading, text, bottomInset }) => {
    const { features, styles } = useChatViewContext();

    const handlePress = useCallback(() => Keyboard.dismiss(), []);

    // Зона едет на UI-потоке вместе с клавиатурой — надпись следует за ней
    // без ре-рендера.
    const wrapStyle = useAnimatedStyle(() => ({
      bottom: bottomInset.value,
    }));

    if (!features.showEmptyState || !visible) return null;

    return (
      <Animated.View style={[ss.wrap, wrapStyle]} onTouchEnd={handlePress}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <ChatText style={styles.shared.emptyStateText}>
            {text ?? DEFAULT_EMPTY_TEXT}
          </ChatText>
        )}
      </Animated.View>
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
    alignItems: "center",
    justifyContent: "center",
  },
});
