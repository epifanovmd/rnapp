import React, { FC, memo, useCallback } from "react";
import { Keyboard, StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { Spinner } from "../../spinner";
import { useChatViewContext } from "../model";
import { ChatText } from "./ChatText";

/**
 * Пустое состояние: текст или спиннер при загрузке, тап скрывает клавиатуру.
 *
 * Центрируется по видимой области, а не по всей высоте чата: снизу её
 * ограничивает панель ввода и клавиатура. Чтобы надпись не уходила ниже центра,
 * `bottomInset` повторяет тот же `contentInset`, что двигает панель ввода.
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
          <Spinner size={36} />
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
