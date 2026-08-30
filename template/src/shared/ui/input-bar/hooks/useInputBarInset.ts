import { useFreezableValue } from "@shared/lib/hooks";
import { useKeyboardHeight } from "@shared/lib/keyboard";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { INPUT_BAR_MIN_HEIGHT } from "../config";
import { resolveInputBarInset, resolveInputBarOffset } from "../utils";

/**
 * Нижнее перекрытие экрана панелью ввода: safe area, клавиатура и высота самой
 * панели, собранные в одно значение.
 *
 * Подписка на клавиатуру на экране одна, и живёт она здесь: посчитай «сколько
 * занято снизу» каждому потребителю отдельно — получишь столько же
 * расходящихся ответов, и расхождение видно глазом. Всё считается на
 * UI-потоке: клавиатура едет покадрово, через рендер значения отставали бы.
 */

/**
 * Сколько едет отступ, когда меняется не клавиатура, а сама панель: замер
 * высоты после первой раскладки, панель ответа, безопасная зона.
 *
 * Контент от этих величин отступает так же, как от клавиатуры, и приезжать они
 * обязаны движением: ступенька дёргает список на всю разницу разом — панель
 * ответа это 48 px.
 */
const INSET_STEP_DURATION = 200;

export interface IInputBarInsetOptions {
  /** Что добавить сверх панели и зоны: зазор, тень, что угодно своё. */
  extraPadding?: number;
  /** Погасить фокус на время заморозки. */
  onBlurInput?: () => void;
  /** Вернуть фокус при разморозке. */
  onRefocusInput?: () => void;
}

export interface IInputBarInset {
  /** Собственная высота панели: уходит в `InputBar.onHeightChange`. */
  setBarHeight: (height: number) => void;
  /**
   * Перекрытие снизу без панели: клавиатура, а без неё — safe area.
   * На него поднимается сама панель (`KeyboardInputBar.offset`).
   */
  barOffset: SharedValue<number>;
  /**
   * Полный след панели от низа экрана, без учёта заморозки.
   *
   * Его берут те, кто едет с клавиатурой всегда: кнопки и оверлеи над панелью.
   */
  liveInset: SharedValue<number>;
  /**
   * То же перекрытие с учётом заморозки — уходит контенту: `insetEnd` списка
   * или распорка скролла.
   */
  contentInset: SharedValue<number>;
  /** Перекрытие, к которому едем: известно из `onStart`, до начала анимации. */
  reservedInset: SharedValue<number>;
  isFrozen: SharedValue<boolean>;
  /**
   * Заморозить отступ контента: пока поверх экрана оверлей, снявший снимок
   * элемента, контент под ним обязан стоять на месте.
   */
  freeze: () => void;
  /** Разморозить; отпускает не сразу, а когда клавиатура вернулась. */
  restore: () => void;
}

export const useInputBarInset = ({
  extraPadding = 0,
  onBlurInput,
  onRefocusInput,
}: IInputBarInsetOptions = {}): IInputBarInset => {
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();

  // Обе величины меняются редко и разом — потому и доводятся анимацией:
  // см. INSET_STEP_DURATION.
  const barHeight = useSharedValue(INPUT_BAR_MIN_HEIGHT);
  const safeBottom = useSharedValue(safeAreaBottom);

  useEffect(() => {
    safeBottom.value = withTiming(safeAreaBottom, {
      duration: INSET_STEP_DURATION,
    });
  }, [safeAreaBottom, safeBottom]);

  const barOffset = useDerivedValue(() =>
    resolveInputBarOffset({
      keyboardHeight: keyboard.height.value,
      safeAreaBottom: safeBottom.value,
    }),
  );

  const liveInset = useDerivedValue(
    () =>
      resolveInputBarInset({
        keyboardHeight: keyboard.height.value,
        safeAreaBottom: safeBottom.value,
        barHeight: barHeight.value,
        extraPadding,
      }),
    [extraPadding],
  );

  // Цель хода известна из `onStart`: по ней резервируется место до того, как
  // клавиатура доедет.
  const liveReserved = useDerivedValue(
    () =>
      resolveInputBarInset({
        keyboardHeight: keyboard.targetHeight.value,
        safeAreaBottom: safeBottom.value,
        barHeight: barHeight.value,
        extraPadding,
      }),
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
    onFreeze: onBlurInput,
    onRestore: onRefocusInput,
  });

  const reservedInset = useDerivedValue(() =>
    frozen.value >= 0 ? frozen.value : liveReserved.value,
  );

  /**
   * Первый замер панели уже был: дальше её высота меняется, а не уточняется.
   *
   * Разница принципиальная. {@link INPUT_BAR_MIN_HEIGHT} — оценка, и с
   * настоящей высотой она расходится на доли точки. Приезжай это расхождение
   * анимацией, отступ рос бы ещё двести миллисекунд после того, как список уже
   * показан, — а список честно едет за отступом, и позиция открытия уползает на
   * ту же точку. Снимок позиции запоминает уползание, следующее открытие берёт
   * его за цель, и так открытие за открытием.
   *
   * Поставленное сразу уточнение целиком укладывается в то время, пока список
   * ещё скрыт: там смещением распоряжается его стартовая доводка, и отступ его
   * не трогает.
   */
  const barSeeded = useRef(false);

  const setBarHeight = useCallback(
    (height: number) => {
      if (!barSeeded.current) {
        barSeeded.current = true;
        barHeight.value = height;

        return;
      }

      barHeight.value = withTiming(height, {
        duration: INSET_STEP_DURATION,
      });
    },
    [barHeight],
  );

  return useMemo(
    () => ({
      setBarHeight,
      barOffset,
      liveInset,
      contentInset,
      reservedInset,
      isFrozen,
      freeze,
      restore,
    }),
    [
      setBarHeight,
      barOffset,
      liveInset,
      contentInset,
      reservedInset,
      isFrozen,
      freeze,
      restore,
    ],
  );
};
