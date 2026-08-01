import { useCallback, useMemo, useRef } from "react";
import { ViewStyle } from "react-native";
import {
  AnimatedStyle,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useFreezableValue } from "../hooks/use-freezable-value";
import { useKeyboardHeight } from "./use-keyboard-height";
import {
  IScrollCompensation,
  useScrollCompensation,
} from "./use-scroll-compensation";

/**
 * Работа с нижней зоной экрана — единственный хук, который нужен экрану
 * с плавающей панелью ввода над прокручиваемым контентом.
 *
 * Умеет три вещи, и каждая отдаётся **отдельным значением**, чтобы
 * прокидывать её ровно туда, куда нужно:
 *
 * | что | значение | кому |
 * |-----|----------|------|
 * | позиция панели | `barStyle` / `barOffset` | плавающей панели ввода, FAB |
 * | отступ контента | `contentInset` | тем, кто стоит над зоной |
 * | компенсация скролла | `scroll` | самому скроллу |
 * | заморозка | `freeze()` / `restore()` | контекстному меню |
 *
 * ## Что мёрзнет, а что нет
 *
 * Заморозка применяется **только к отступу контента** (`contentInset`,
 * `scroll`). `barOffset` остаётся живым всегда — панель уезжает вместе
 * с клавиатурой при любых обстоятельствах.
 *
 * Это порт эталона: `updateCollectionInsets` выходит по `isInsetFrozen`,
 * то есть держит инсет коллекции, а констрейнт панели на
 * `keyboardLayoutGuide.topAnchor` не трогает никто. Контекстное меню
 * снимает снапшот пузыря — двигаться не должен именно контент; панель
 * в снапшоте не участвует, и её остановка посреди экрана выглядела бы
 * как зависшая вьюха.
 *
 * ## Использование
 *
 * ```tsx
 * const kb = useKeyboardInset({
 *   extraPadding: 8,
 *   onBlur: () => inputRef.current?.blur(),
 *   onRefocus: () => inputRef.current?.focus(),
 * });
 *
 * <Animated.ScrollView
 *   ref={kb.scroll.scrollRef}
 *   onLayout={kb.scroll.onLayout}
 *   onContentSizeChange={kb.scroll.onContentSizeChange}
 *   onScrollBeginDrag={kb.scroll.onScrollBeginDrag}
 *   onScrollEndDrag={kb.scroll.onScrollEndDrag}
 * >
 *   {content}
 *   <Animated.View style={kb.scroll.spacerStyle} />
 * </Animated.ScrollView>
 *
 * <KeyboardInputBar style={kb.barStyle}>
 *   <InputBar onHeightChange={kb.setBarHeight} />
 * </KeyboardInputBar>
 * ```
 *
 * Развеска скролла остаётся за потребителем: ref, распорка и обработчики —
 * это разметка, и у разных списков она называется по-разному
 * (`refScrollView` + `ListFooterComponent` у LegendList, обычные пропы
 * у `ScrollView`). Готовая обвязка для обычного скролла —
 * `shared/ui/keyboard-scroll-view`.
 */

export interface IKeyboardInsetOptions {
  /** Собственные отступы контента снизу, не связанные с клавиатурой. */
  extraPadding?: number;
  /**
   * Высота панели до первого замера. Нативная панель под Fabric не участвует
   * в измерении Yoga, поэтому нулевой старт оставил бы её за экраном.
   */
  initialBarHeight?: number;
  /** Снять фокус с поля ввода при заморозке. */
  onBlur?: () => void;
  /** Вернуть фокус в поле ввода при разморозке. */
  onRefocus?: () => void;
}

export interface IKeyboardInset {
  // ─── Панель (всегда живая) ───────────────────────────────────────────

  /** Готовый стиль плавающей панели: `translateY` на высоту зоны. */
  barStyle: AnimatedStyle<ViewStyle>;
  /** Та же величина числом — для FAB и прочего, что стоит над зоной. */
  barOffset: SharedValue<number>;
  /** Живая высота панели. */
  barHeight: SharedValue<number>;
  /** Записать замеренную высоту панели — прямо в `onHeightChange`. */
  setBarHeight: (height: number) => void;

  // ─── Контент (замораживаемый) ────────────────────────────────────────

  /** Суммарное перекрытие контента снизу: зона + панель + свои отступы. */
  contentInset: SharedValue<number>;
  /** Всё, что требуется скроллу для компенсации. */
  scroll: IScrollCompensation;

  // ─── Заморозка ───────────────────────────────────────────────────────

  /** Активна ли заморозка отступа контента. */
  isFrozen: SharedValue<boolean>;
  /** Заморозить отступ контента (перед показом контекстного меню). */
  freeze: () => void;
  /** Отпустить отступ, вернув клавиатуру если она была открыта. */
  restore: () => void;

  /** Открыта ли клавиатура — синхронное чтение из JS. */
  isKeyboardVisible: () => boolean;
  /**
   * Суммарное перекрытие контента снизу числом — синхронное чтение из JS.
   * Для центрирования скролла по видимой области (над клавиатурой и панелью).
   */
  getContentInset: () => number;
}

export const useKeyboardInset = (
  options: IKeyboardInsetOptions = {},
): IKeyboardInset => {
  const { extraPadding = 0, initialBarHeight = 0, onBlur, onRefocus } = options;

  const safeAreaBottom = useSafeAreaInsets().bottom;
  const keyboard = useKeyboardHeight();
  const barHeight = useSharedValue(initialBarHeight);
  // JS-зеркало высоты панели: `barHeight` живёт на UI-потоке, а для
  // `getContentInset` нужно синхронное чтение из JS-обработчика.
  const barHeightRef = useRef(initialBarHeight);

  // Нижняя граница экрана — на ней стоит панель. Порт keyboardLayoutGuide
  // + followsUndockedKeyboard. Значение всегда живое.
  const overlay = useDerivedValue(
    () => Math.max(keyboard.height.value, safeAreaBottom),
    [safeAreaBottom],
  );

  // То же, но по цели: клавиатура сообщает конечную высоту в onStart, до
  // первого кадра анимации.
  const overlayTarget = useDerivedValue(
    () => Math.max(keyboard.targetHeight.value, safeAreaBottom),
    [safeAreaBottom],
  );

  // Перекрытие контента снизу: зона + панель над ней + свои отступы.
  const liveInset = useDerivedValue(
    () => overlay.value + barHeight.value + extraPadding,
    [extraPadding],
  );

  // Резерв под целевую зону: распорка вырастает до начала анимации, поэтому
  // у самого низа scrollTo не упирается в ещё не выросший contentSize.
  const liveReserved = useDerivedValue(
    () => overlayTarget.value + barHeight.value + extraPadding,
    [extraPadding],
  );

  // Мёрзнет только контент — см. «Что мёрзнет, а что нет» выше.
  // Механика заморозки общая и живёт в shared/lib/hooks: к клавиатуре она
  // не привязана, здесь только выбор замораживаемой величины.
  const {
    value: contentInset,
    frozen,
    isFrozen,
    freeze,
    restore,
  } = useFreezableValue({
    live: liveInset,
    isSourceActive: keyboard.isVisible,
    onFreeze: onBlur,
    onRestore: onRefocus,
  });
  // Резерв держим на том же значении: иначе распорка схлопнется под
  // замороженным контентом и диапазон скролла уедет из-под него.
  const reservedInset = useDerivedValue(() =>
    frozen.value >= 0 ? frozen.value : liveReserved.value,
  );

  const scroll = useScrollCompensation(contentInset, reservedInset);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -overlay.value }],
  }));

  const setBarHeight = useCallback(
    (height: number) => {
      barHeightRef.current = height;
      barHeight.value = height;
    },
    [barHeight],
  );

  const getContentInset = useCallback(
    () =>
      Math.max(keyboard.getHeight(), safeAreaBottom) +
      barHeightRef.current +
      extraPadding,
    [keyboard, safeAreaBottom, extraPadding],
  );

  return useMemo(
    () => ({
      barStyle,
      barOffset: overlay,
      barHeight,
      setBarHeight,
      contentInset,
      scroll,
      isFrozen,
      freeze,
      restore,
      isKeyboardVisible: keyboard.isVisible,
      getContentInset,
    }),
    [
      barStyle,
      overlay,
      barHeight,
      setBarHeight,
      contentInset,
      scroll,
      isFrozen,
      freeze,
      restore,
      keyboard.isVisible,
      getContentInset,
    ],
  );
};
