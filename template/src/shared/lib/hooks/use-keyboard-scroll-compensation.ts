import { useCallback, useMemo } from "react";
import { LayoutChangeEvent } from "react-native";
import Animated, {
  AnimatedRef,
  AnimatedStyle,
  scrollTo,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
} from "react-native-reanimated";

/**
 * Компенсация перекрытия скролла снизу — порт `updateCollectionInsets`
 * из `ChatViewController` (IOSChatView).
 *
 * Нативный эталон никогда не двигает коллекцию; зону, которую снизу
 * перекрывают панель ввода и клавиатура, он компенсирует внутри скролла
 * (`contentInset.bottom` + коррекция `contentOffset`), не трогая саму вьюху.
 * Сдвигать вьюху нельзя: верх контента уедет за границу и станет недостижим.
 *
 * Здесь тот же принцип, но на кросс-платформенных примитивах: перекрытие
 * живёт **распоркой в конце контента**, а не в `contentInset`. На Android
 * инсета нет, а распорка одинаково работает везде и — в отличие от инсета —
 * входит в размер контента, поэтому нативные `scrollToEnd`, автоскролл MVCP
 * и любые расчёты «внизу ли скролл» корректны без поправок.
 *
 * ## Принцип работы
 *
 * Единственное состояние — `appliedOverlay`: сколько перекрытия уже
 * учтено **и в распорке, и в позиции скролла**. Каждое изменение `bottomOverlay`
 * считается дельтой от этого значения: распорка меняется, а скролл двигается
 * на ту же дельту, так что расстояние до конца контента сохраняется.
 *
 * Модель самовосстанавливается: поскольку дельта считается от реально
 * применённого значения, а не от запомненной высоты клавиатуры, любое
 * количество пропущенных событий (заморозка, поворот, смена панели)
 * схлопывается в один корректный шаг.
 *
 * ## Заморозка
 *
 * Отдельного флага нет: замораживает тот, кто управляет `bottomOverlay`,
 * — достаточно перестать обновлять shared value. В чате это тот же
 * `frozenOverlay`, от которого живут панель ввода и FAB, поэтому бар,
 * FAB и скролл замирают и оттаивают как одно целое.
 *
 * ## Использование
 *
 * ```tsx
 * const overlay = useKeyboardOverlay();
 * const inputBarHeight = useSharedValue(0);
 * const bottomOverlay = useDerivedValue(
 *   () => overlay.value + inputBarHeight.value,
 * );
 * const { scrollRef, spacerStyle, onLayout, onContentSizeChange } =
 *   useKeyboardScrollCompensation(bottomOverlay);
 *
 * <Animated.ScrollView ref={scrollRef} onLayout={onLayout}
 *   onContentSizeChange={onContentSizeChange}>
 *   {content}
 *   <Animated.View style={spacerStyle} />
 * </Animated.ScrollView>
 * ```
 *
 * В чате (FlashList) распорка уходит в `ListFooterComponent`, а `scrollRef`
 * подмешивается в `renderScrollComponent`.
 */

export interface IKeyboardScrollCompensation {
  scrollRef: AnimatedRef<Animated.ScrollView>;
  spacerStyle: AnimatedStyle<{ height: number }>;
  onLayout: (e: LayoutChangeEvent) => void;
  onContentSizeChange: (width: number, height: number) => void;
}

export function useKeyboardScrollCompensation(
  bottomOverlay: SharedValue<number>,
): IKeyboardScrollCompensation {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollViewOffset(scrollRef);

  const appliedOverlay = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const viewportHeight = useSharedValue(0);

  useAnimatedReaction(
    () => bottomOverlay.value,
    target => {
      const applied = appliedOverlay.value;
      const delta = target - applied;

      if (Math.abs(delta) < 0.5) return;

      // Распорка меняется первой — она и есть «нижний инсет».
      appliedOverlay.value = target;

      // Ожидаемая высота контента после коммита распорки — коммит
      // отстаёт на кадр, а решение о скролле нужно сейчас.
      const contentEnd = contentHeight.value - applied + target;
      const maxOffset = contentEnd - viewportHeight.value;

      // Контент короче видимой области — держим прижатым к верху.
      if (maxOffset <= 0) return;

      const next = Math.min(Math.max(scrollY.value + delta, 0), maxOffset);

      // Пишем позицию сами: во время анимации реакция на каждый кадр,
      // и база для следующей дельты должна быть актуальной.
      scrollY.value = next;
      scrollTo(scrollRef, 0, next, false);
    },
  );

  const spacerStyle = useAnimatedStyle(() => ({
    height: appliedOverlay.value,
  }));

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      viewportHeight.value = e.nativeEvent.layout.height;
    },
    [viewportHeight],
  );

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeight.value = height;
    },
    [contentHeight],
  );

  // Идентичность обязана быть стабильной: FlashList пересобирает компонент
  // скролла через `Animated.createAnimatedComponent` при каждом изменении
  // `renderScrollComponent`, а новый тип — это ремоунт с потерей позиции.
  return useMemo(
    () => ({ scrollRef, spacerStyle, onLayout, onContentSizeChange }),
    [scrollRef, spacerStyle, onLayout, onContentSizeChange],
  );
}
