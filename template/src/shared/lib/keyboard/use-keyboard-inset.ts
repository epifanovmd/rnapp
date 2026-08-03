import { useCallback, useMemo, useRef } from "react";
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useFreezableValue } from "../hooks/use-freezable-value";
import { useKeyboardHeight } from "./use-keyboard-height";

export interface IKeyboardInsetOptions {
  /** Собственные отступы контента снизу, не связанные с клавиатурой. */
  extraPadding?: number;
  /** Высота панели до первого замера: нулевой старт увёл бы её за экран. */
  initialBarHeight?: number;
  /** Снять фокус с поля ввода при заморозке. */
  onBlur?: () => void;
  /** Вернуть фокус в поле ввода при разморозке. */
  onRefocus?: () => void;
}

export interface IKeyboardInset {
  /** Перекрытие снизу клавиатурой, а без неё — safe area. */
  occludedBottom: SharedValue<number>;
  /** Живая высота панели ввода — её замеряет и сообщает сама панель. */
  barHeight: SharedValue<number>;
  setBarHeight: (height: number) => void;

  /** Полное перекрытие контента снизу: зона + панель + свои отступы. */
  contentInset: SharedValue<number>;
  /** Целевое перекрытие: конечная высота известна до начала анимации. */
  reservedInset: SharedValue<number>;
  /**
   * Перекрытие без клавиатуры — для потребителей, которым её высоту добавляет
   * кто-то другой (нативный скролл ведёт `contentInset` сам).
   */
  composerInset: SharedValue<number>;

  isFrozen: SharedValue<boolean>;
  /** Заморозить отступ контента перед показом контекстного меню. */
  freeze: () => void;
  /** Отпустить отступ, вернув клавиатуру если она была открыта. */
  restore: () => void;

  isKeyboardVisible: () => boolean;
  /** Полное перекрытие числом — синхронное чтение из JS. */
  getContentInset: () => number;
}

/**
 * Нижняя зона экрана для плавающей панели над прокручиваемым контентом.
 *
 * Знает, **насколько** низ перекрыт, и ничего не знает о том, **как** панель
 * двигается: её стиль строит сама панель. Один инстанс на экран — второй стал
 * бы второй подпиской на клавиатуру.
 *
 * Заморозка держит только отступ контента: панель живая всегда, иначе она
 * выглядела бы зависшей посреди экрана.
 */
export const useKeyboardInset = (
  options: IKeyboardInsetOptions = {},
): IKeyboardInset => {
  const { extraPadding = 0, initialBarHeight = 0, onBlur, onRefocus } = options;

  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const barHeight = useSharedValue(initialBarHeight);

  const barHeightRef = useRef(initialBarHeight);

  const occludedBottom = useDerivedValue(
    () => Math.max(keyboard.height.value, safeAreaBottom),
    [safeAreaBottom],
  );

  const occludedBottomTarget = useDerivedValue(
    () => Math.max(keyboard.targetHeight.value, safeAreaBottom),
    [safeAreaBottom],
  );

  const liveInset = useDerivedValue(
    () => occludedBottom.value + barHeight.value + extraPadding,
    [extraPadding],
  );

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

  const composerInset = useDerivedValue(
    () =>
      Math.max(0, safeAreaBottom - keyboard.height.value) +
      barHeight.value +
      extraPadding,
    [safeAreaBottom, extraPadding],
  );

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
      occludedBottom,
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
