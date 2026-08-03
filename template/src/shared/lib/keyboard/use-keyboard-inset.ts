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

/**
 * Нижняя зона экрана для плавающей панели над прокручиваемым контентом.
 * Отдаёт инсеты и положение панели; скролл-компенсация — отдельный хук
 * `useKeyboardScrollCompensation`, которому передаются `contentInset` +
 * `reservedInset`. Один инстанс на экран: второй — вторая подписка на
 * клавиатуру, и панель разъедется с контентом.
 *
 * Заморозка держит только отступ контента (`contentInset`), панель живая
 * всегда: меню снимает снапшот пузыря, поэтому неподвижным
 * должен быть контент, а замершая посреди экрана панель выглядела бы как
 * зависшая вьюха.
 */

export interface IKeyboardInsetOptions {
  /** Собственные отступы контента снизу, не связанные с клавиатурой. */
  extraPadding?: number;
  /**
   * Высота панели до первого замера. Нативная панель под Fabric не участвует
   * в измерении Yoga — нулевой старт оставил бы её за экраном.
   */
  initialBarHeight?: number;
  /** Снять фокус с поля ввода при заморозке. */
  onBlur?: () => void;
  /** Вернуть фокус в поле ввода при разморозке. */
  onRefocus?: () => void;
}

export interface IKeyboardInset {
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
  /** Резерв под целевое перекрытие — отдаётся в `useKeyboardScrollCompensation`. */
  reservedInset: SharedValue<number>;
  /**
   * Часть перекрытия, которую клавиатура **не** покрывает: панель, safe area
   * под ней и свои отступы.
   *
   * Для потребителей, которым высоту клавиатуры добавляет кто-то другой —
   * например, нативный `KeyboardChatScrollView` под списком: он ведёт
   * `contentInset` на высоту клавиатуры сам, а всё остальное принимает
   * отдельным значением (`extraContentPadding`). Складывать их дважды нельзя,
   * поэтому здесь именно разница, а не полное перекрытие.
   */
  composerInset: SharedValue<number>;

  // ─── Заморозка ───────────────────────────────────────────────────────

  /** Активна ли заморозка отступа контента. */
  isFrozen: SharedValue<boolean>;
  /** Заморозить отступ контента (перед показом контекстного меню). */
  freeze: () => void;
  /** Отпустить отступ, вернув клавиатуру если она была открыта. */
  restore: () => void;

  /** Открыта ли клавиатура — синхронное чтение из JS. */
  isKeyboardVisible: () => boolean;
  /** Суммарное перекрытие снизу числом — синхронное чтение из JS. */
  getContentInset: () => number;
}

export const useKeyboardInset = (
  options: IKeyboardInsetOptions = {},
): IKeyboardInset => {
  const { extraPadding = 0, initialBarHeight = 0, onBlur, onRefocus } = options;

  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const barHeight = useSharedValue(initialBarHeight);

  const barHeightRef = useRef(initialBarHeight);

  // Сколько низа занято не контентом: клавиатура, а без неё — safe area.
  const occludedBottom = useDerivedValue(
    () => Math.max(keyboard.height.value, safeAreaBottom),
    [safeAreaBottom],
  );

  // То же по цели: конечная высота сообщается в onStart, до анимации.
  const occludedBottomTarget = useDerivedValue(
    () => Math.max(keyboard.targetHeight.value, safeAreaBottom),
    [safeAreaBottom],
  );

  // Перекрытие контента снизу: зона + панель + свои отступы.
  const liveInset = useDerivedValue(
    () => occludedBottom.value + barHeight.value + extraPadding,
    [extraPadding],
  );

  // Резерв под целевую зону — распорка вырастает до начала движения.
  const liveReserved = useDerivedValue(
    () => occludedBottomTarget.value + barHeight.value + extraPadding,
    [extraPadding],
  );

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

  const reservedInset = useDerivedValue(() =>
    frozen.value >= 0 ? frozen.value : liveReserved.value,
  );

  // Ровно `contentInset` минус высота клавиатуры: при открытой клавиатуре
  // safe area уже перекрыта ею и второй раз не считается.
  const composerInset = useDerivedValue(
    () =>
      Math.max(0, safeAreaBottom - keyboard.height.value) +
      barHeight.value +
      extraPadding,
    [safeAreaBottom, extraPadding],
  );

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
      reservedInset,
      composerInset,
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
      reservedInset,
      composerInset,
      isFrozen,
      freeze,
      restore,
      keyboard.isVisible,
      getContentInset,
    ],
  );
};
