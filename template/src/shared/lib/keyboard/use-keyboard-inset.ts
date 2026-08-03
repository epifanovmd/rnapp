import { useCallback, useMemo } from "react";
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useFreezableValue } from "../hooks/use-freezable-value";
import { useKeyboardHeight } from "./use-keyboard-height";

export interface IKeyboardInsetOptions {
  /**
   * Живая высота панели ввода — её замеряет и ведёт сама панель.
   *
   * Входное значение, а не собственность хука: он лишь складывает её с
   * клавиатурой и safe area.
   */
  barHeight: SharedValue<number>;
  /** Собственные отступы контента снизу, не связанные с клавиатурой. */
  extraPadding?: number;
  /** Снять фокус с поля ввода при заморозке. */
  onBlur?: () => void;
  /** Вернуть фокус в поле ввода при разморозке. */
  onRefocus?: () => void;
}

export interface IKeyboardInset {
  /** Перекрытие снизу клавиатурой, а без неё — safe area. */
  occludedBottom: SharedValue<number>;

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
export const useKeyboardInset = ({
  barHeight,
  extraPadding = 0,
  onBlur,
  onRefocus,
}: IKeyboardInsetOptions): IKeyboardInset => {
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();

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

  const getContentInset = useCallback(
    () =>
      Math.max(keyboard.getHeight(), safeAreaBottom) +
      barHeight.value +
      extraPadding,
    [keyboard, safeAreaBottom, barHeight, extraPadding],
  );

  return useMemo(
    () => ({
      occludedBottom,
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
