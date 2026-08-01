import { useCallback } from "react";
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Компенсация скролла при поднятии клавиатуры — порт updateCollectionInsets
 * из пода IOSChatView.
 *
 * Работает одинаково в чате (FlashList) и в ScrollView:
 * 1. Контент продлевается под инпут-бар на `listExtension`.
 * 2. При открытии клавиатуры список сдвигается translateY на `listShift`,
 *    сохраняя расстояние от нижнего края — сообщения не уезжают под
 *    клавиатуру, а остаются на месте.
 * 3. Когда контент короче видимой области, сдвиг не применяется
 *    (порт guard-а `maxOffsetY > minOffsetY`).
 *
 * Использование:
 * ```tsx
 * const { listShift, listExtension, registerScrollMetrics } =
 *   useKeyboardScrollCompensation(bottomInset, inputBarHeight);
 *
 * // Стили (одинаковые для FlashList и ScrollView):
 * const wrapStyle = { bottom: -listExtension };
 * const contentPadding = listExtension + collectionBottomPadding;
 * const shiftStyle = useAnimatedStyle(() => ({
 *   transform: [{ translateY: -listShift.value }],
 * }));
 * ```
 */

export function useKeyboardScrollCompensation(
  bottomInset: SharedValue<number>,
  inputBarHeight: SharedValue<number>,
) {
  const safeArea = useSafeAreaInsets();
  const safeAreaBottom = safeArea.bottom;

  const containerHeightSV = useSharedValue(0);
  const contentHeightSV = useSharedValue(0);
  const footerPaddingSV = useSharedValue(0);

  const listExtension = safeAreaBottom; /* + inputBarHeight — caller adds */

  const listShift = useDerivedValue(() => {
    const zone = bottomInset.value + inputBarHeight.value;
    const contentEnd = contentHeightSV.value - footerPaddingSV.value;
    const visibleHeight = containerHeightSV.value - zone;

    return Math.min(zone, Math.max(0, contentEnd - visibleHeight));
  });

  /** Вызвать из onLayout контейнера списка. */
  const onContainerLayout = useCallback(
    (height: number) => {
      containerHeightSV.value = height;
    },
    [containerHeightSV],
  );

  /** Вызвать из onContentSizeChange списка. */
  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeightSV.value = height;
    },
    [contentHeightSV],
  );

  /** Сообщить текущий content padding — используется для footerPadding. */
  const setFooterPadding = useCallback(
    (padding: number) => {
      footerPaddingSV.value = padding;
    },
    [footerPaddingSV],
  );

  return {
    /** Сдвиг translateY (shared value). */
    listShift,
    /** На сколько список продлевается под инпут-бар. */
    listExtension,
    /** Колбэки для регистрации размеров. */
    onContainerLayout,
    onContentSizeChange,
    setFooterPadding,
  };
}
