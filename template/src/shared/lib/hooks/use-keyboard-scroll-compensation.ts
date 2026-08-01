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
 * Компенсация нижней зоны скролла — порт `updateCollectionInsets`
 * из `ChatViewController` (IOSChatView).
 *
 * Нативный эталон никогда не двигает саму коллекцию: она во весь экран, а
 * зону, которую снизу перекрывают панель ввода и клавиатура, компенсирует
 * `contentInset.bottom` + коррекция `contentOffset` на ту же дельту, так что
 * расстояние до конца контента сохраняется. Верх при этом всегда достижим —
 * сдвигается содержимое скролла, а не вьюха.
 *
 * Здесь то же самое, но на кросс-платформенных примитивах: зона живёт в
 * распорке в конце контента (`spacerStyle`), а не в `contentInset` — на
 * Android его нет, а распорка одинаково работает везде и, в отличие от
 * инсета, входит в размер контента. Благодаря этому нативные `scrollToEnd`,
 * автоскролл `maintainVisibleContentPosition` и любые расчёты «внизу ли
 * скролл» продолжают работать без поправок на клавиатуру.
 *
 * ## Состояние — «сколько применили», а не «какая была клавиатура»
 *
 * Единственная переменная — `appliedZone`: зона, которая уже отражена и в
 * распорке, и в позиции скролла. Любое изменение считается дельтой от неё,
 * поэтому логика самовосстанавливается: сколько бы событий ни было пропущено
 * (заморозка на время контекстного меню, смена высоты панели, поворот),
 * следующий пересчёт приведёт скролл ровно к целевому состоянию и ни разу не
 * применит одну и ту же дельту дважды.
 *
 * ## Заморозка
 *
 * Отдельного флага нет: замораживает тот, кто владеет `zone` — достаточно
 * перестать её обновлять (в чате это общий `bottomInset`, от которого живут
 * ещё панель ввода и FAB). Пока значение не меняется, хук не трогает ни
 * распорку, ни скролл; когда владелец отпускает зону, разница отыгрывается
 * одним корректным шагом.
 *
 * ## Использование
 *
 * ```tsx
 * const zone = useDerivedValue(() => bottomInset.value + inputBarHeight.value);
 * const { scrollRef, spacerStyle, onLayout, onContentSizeChange } =
 *   useKeyboardScrollCompensation(zone);
 *
 * <Animated.ScrollView ref={scrollRef} onLayout={onLayout}
 *   onContentSizeChange={onContentSizeChange}>
 *   {content}
 *   <Animated.View style={spacerStyle} />
 * </Animated.ScrollView>
 * ```
 * Для FlashList распорка уходит в `ListFooterComponent`, а `scrollRef` — на
 * скролл из `renderScrollComponent`.
 */

export interface IKeyboardScrollCompensation {
  /** Ref для самого скролла: нужен и для чтения offset, и для `scrollTo`. */
  scrollRef: AnimatedRef<Animated.ScrollView>;
  /** Стиль распорки в конце контента (её высота и есть нижняя зона). */
  spacerStyle: AnimatedStyle<{ height: number }>;
  /** Повесить на `onLayout` скролла — высота видимой области. */
  onLayout: (e: LayoutChangeEvent) => void;
  /** Повесить на `onContentSizeChange` скролла. */
  onContentSizeChange: (width: number, height: number) => void;
}

export function useKeyboardScrollCompensation(
  zone: SharedValue<number>,
): IKeyboardScrollCompensation {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollViewOffset(scrollRef);

  const appliedZone = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const viewportHeight = useSharedValue(0);

  useAnimatedReaction(
    () => zone.value,
    target => {
      const applied = appliedZone.value;
      const delta = target - applied;

      // Полкадра туда-сюда не считаем: иначе на каждый кадр анимации
      // клавиатуры будет лишний scrollTo с нулевым эффектом.
      if (Math.abs(delta) < 0.5) return;

      // Распорку двигаем всегда — это и есть нижний инсет.
      appliedZone.value = target;

      // Ожидаемая высота контента после коммита распорки: сам коммит придёт
      // кадром позже, а решение о скролле нужно принять сейчас.
      const contentEnd = contentHeight.value - applied + target;
      const maxOffset = contentEnd - viewportHeight.value;

      // Порт guard `maxOffsetY > minOffsetY`: контент короче видимой области —
      // держим его прижатым к верху, скролл не трогаем.
      if (maxOffset <= 0) return;

      const next = Math.min(Math.max(scrollY.value + delta, 0), maxOffset);

      // Пишем сами, не дожидаясь события скролла: во время анимации реакция
      // отрабатывает каждый кадр, и база для следующей дельты должна быть
      // уже актуальной.
      scrollY.value = next;
      scrollTo(scrollRef, 0, next, false);
    },
  );

  const spacerStyle = useAnimatedStyle(() => ({ height: appliedZone.value }));

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

  // Идентичность держим стабильной: у FlashList `renderScrollComponent`
  // пересоздаёт компонент скролла (`Animated.createAnimatedComponent`), а
  // новый тип компонента для React — это перемонтирование ScrollView с
  // потерей позиции. Всё внутри и так стабильно (useAnimatedRef,
  // useAnimatedStyle и useCallback от shared values), поэтому объект
  // создаётся один раз.
  return useMemo(
    () => ({ scrollRef, spacerStyle, onLayout, onContentSizeChange }),
    [scrollRef, spacerStyle, onLayout, onContentSizeChange],
  );
}
