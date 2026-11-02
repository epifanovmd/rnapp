import { useCallback, useMemo } from "react";
import { LayoutChangeEvent } from "react-native";
import { SharedValue, useSharedValue } from "react-native-reanimated";

export interface ISharedLayout {
  width: SharedValue<number>;
  height: SharedValue<number>;
  onLayout: (event: LayoutChangeEvent) => void;
}

/**
 * Измеренный размер вью в shared values: то же, что useLayout, но без
 * ре-рендера — для анимаций, которые читают размер прямо на UI-потоке.
 *
 * Значения пишутся только при реальном изменении: layout-событие прилетает
 * и когда размер не поменялся, а лишняя запись будит все зависимые worklet'ы.
 */
export const useSharedLayout = (): ISharedLayout => {
  const width = useSharedValue(0);
  const height = useSharedValue(0);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;

      if (width.value !== nextWidth) {
        width.value = nextWidth;
      }

      if (height.value !== nextHeight) {
        height.value = nextHeight;
      }
    },
    [height, width],
  );

  return useMemo(
    () => ({ width, height, onLayout }),
    [height, onLayout, width],
  );
};
