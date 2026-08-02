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
 * Нижняя зона экрана — единственный хук, который нужен экрану с плавающей
 * панелью ввода над прокручиваемым контентом. Ровно один инстанс на экран:
 * второй — это вторая подписка на клавиатуру, и панель разъедется с контентом.
 *
 * Каждая задача отдаётся **отдельным значением**, чтобы прокидывать её явно:
 * `barStyle`/`barOffset` — панели и FAB, `contentInset` + `scroll` — скроллу,
 * `freeze()`/`restore()` — контекстному меню.
 *
 * **Заморозка держит только отступ контента**; `barOffset` живой всегда.
 * Это порт эталона (`updateCollectionInsets` выходит по `isInsetFrozen`, а
 * констрейнт панели на `keyboardLayoutGuide` не трогает никто): меню снимает
 * снапшот пузыря, поэтому неподвижным должен быть контент, а замершая посреди
 * экрана панель выглядела бы как зависшая вьюха.
 *
 * Развеска скролла — за потребителем: у разных списков она называется
 * по-разному. Готовая обвязка — `shared/ui/keyboard-scroll-view`.
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

  // Сколько низа экрана занято не контентом: клавиатурой, а без неё — safe
  // area. На этой границе стоит панель. Порт keyboardLayoutGuide +
  // followsUndockedKeyboard, значение всегда живое.
  const occludedBottom = useDerivedValue(
    () => Math.max(keyboard.height.value, safeAreaBottom),
    [safeAreaBottom],
  );

  // То же, но по цели: клавиатура сообщает конечную высоту в onStart, до
  // первого кадра анимации.
  const occludedBottomTarget = useDerivedValue(
    () => Math.max(keyboard.targetHeight.value, safeAreaBottom),
    [safeAreaBottom],
  );

  // Перекрытие контента снизу: зона + панель над ней + свои отступы.
  const liveInset = useDerivedValue(
    () => occludedBottom.value + barHeight.value + extraPadding,
    [extraPadding],
  );

  // Резерв под целевую зону: распорка вырастает до начала анимации, поэтому
  // у самого низа scrollTo не упирается в ещё не выросший contentSize.
  const liveReserved = useDerivedValue(
    () => occludedBottomTarget.value + barHeight.value + extraPadding,
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
    transform: [{ translateY: -occludedBottom.value }],
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
      barOffset: occludedBottom,
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
      occludedBottom,
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
