import { RefObject, useCallback, useContext, useEffect, useRef } from "react";
import {
  findNodeHandle,
  LayoutChangeEvent,
  TextInput,
  TextInputContentSizeChangeEvent,
} from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";

import { isFieldHeightChange } from "./field-layout";
import { KeyboardAwareContext } from "./keyboard-aware-context";

/**
 * Поле кита в keyboard-aware скролле: регистрирует контейнер поля под тегом
 * своего TextInput, чтобы над клавиатурой оказывалось поле целиком (label,
 * описание, ошибка, счётчик), и сообщает об изменении высоты. Вне такого
 * скролла — ничего не делает.
 *
 * `containerRef` и `onLayout` вешаются на `Animated.View` контейнера с
 * `collapsable={false}` (иначе Fabric может его схлопнуть и `measure` вернёт
 * null), `onContentSizeChange` — на TextInput: рост multiline при вводе
 * приходит отсюда, даже если layout контейнера не успел сообщить.
 */
export const useKeyboardAwareField = (
  inputRef: RefObject<TextInput | null>,
) => {
  const registry = useContext(KeyboardAwareContext);
  const containerRef = useAnimatedRef<Animated.View>();
  const containerHeight = useRef(-1);
  const contentHeight = useRef(-1);

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
      const changed = isFieldHeightChange(containerHeight.current, height);

      containerHeight.current = height;

      if (changed) registry?.notifyLayout();
    },
    [registry],
  );

  const onContentSizeChange = useCallback(
    (event: TextInputContentSizeChangeEvent) => {
      const { height } = event.nativeEvent.contentSize;
      const changed = isFieldHeightChange(contentHeight.current, height);

      contentHeight.current = height;

      if (changed) registry?.notifyLayout();
    },
    [registry],
  );

  return { containerRef, onLayout, onContentSizeChange };
};
