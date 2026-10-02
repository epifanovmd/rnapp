import { RefObject, useCallback, useContext, useEffect, useRef } from "react";
import { findNodeHandle, LayoutChangeEvent, TextInput } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";

import { KeyboardAwareContext } from "./keyboard-aware-context";

/**
 * Поле кита в keyboard-aware скролле: регистрирует контейнер поля под тегом
 * своего TextInput, чтобы над клавиатурой оказывалось поле целиком (label,
 * описание, ошибка), и сообщает об изменении высоты. Вне такого скролла —
 * ничего не делает.
 *
 * `containerRef` и `onLayout` вешаются на `Animated.View` контейнера с
 * `collapsable={false}` (иначе Fabric может его схлопнуть и `measure` вернёт null).
 */
export const useKeyboardAwareField = (
  inputRef: RefObject<TextInput | null>,
) => {
  const registry = useContext(KeyboardAwareContext);
  const containerRef = useAnimatedRef<Animated.View>();
  const heightRef = useRef(-1);

  useEffect(() => {
    if (!registry) return;

    const tag = findNodeHandle(inputRef.current);

    if (!tag) return;

    registry.register(tag, containerRef);

    return () => registry.unregister(tag);
  }, [registry, inputRef, containerRef]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      const previous = heightRef.current;

      heightRef.current = height;

      if (previous >= 0 && Math.abs(previous - height) >= 0.5) {
        registry?.notifyLayout();
      }
    },
    [registry],
  );

  return { containerRef, onLayout };
};
