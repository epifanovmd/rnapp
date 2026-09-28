import {
  Extrapolation,
  ExtrapolationType,
  interpolate,
  SharedValue,
  useDerivedValue,
} from "react-native-reanimated";

/**
 * Интерполяция любого источника (офсет скролла, offset бара, прогресс жеста)
 * в произвольный выходной диапазон.
 *
 * Диапазоны сравниваются по содержимому: литерал в аргументе не пересоздаёт
 * derived value на каждом рендере.
 */
export const useInterpolatedValue = (
  source: SharedValue<number>,
  inputRange: readonly number[],
  outputRange: readonly number[],
  extrapolation: ExtrapolationType = Extrapolation.CLAMP,
): Readonly<SharedValue<number>> => {
  const input = inputRange.join();
  const output = outputRange.join();

  return useDerivedValue(
    () =>
      interpolate(
        source.value,
        [...inputRange],
        [...outputRange],
        extrapolation,
      ),

    [source, input, output, extrapolation],
  );
};
