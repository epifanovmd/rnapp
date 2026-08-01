import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKeyboardFreeze } from "./use-keyboard-freeze";
import { useKeyboardHeight } from "./use-keyboard-height";

/**
 * Нижняя зона экрана — единственное, что должен знать обычный потребитель.
 *
 * `overlay` = `max(keyboardHeight, safeAreaBottom)`: когда клавиатура скрыта,
 * низ занимает safe area, когда открыта — сама клавиатура. Конкретная
 * арифметика — забота хука, а не тех, кто на нём стоит (панель ввода, FAB,
 * инсет списка).
 *
 * Хук композирует три независимые части:
 * `useKeyboardHeight` (сырая высота) → `overlay` (арифметика зоны) →
 * `useKeyboardFreeze` (подмена живого значения замороженным). Каждая
 * из них самостоятельна и тестируется отдельно; здесь только сборка.
 */

export interface IKeyboardOverlayOptions {
  /** Вернуть фокус в поле ввода при разморозке. */
  onRefocus?: () => void;
  /** Снять фокус с поля ввода при заморозке. */
  onBlur?: () => void;
}

export interface IKeyboardOverlay {
  /**
   * Нижняя зона: `max(высота клавиатуры, safe area)`, либо замороженное
   * значение пока идёт показ контекстного меню.
   */
  overlay: SharedValue<number>;
  /**
   * Зона, к которой идёт движение прямо сейчас. Совпадает с `overlay`
   * в покое; во время анимации открытия опережает его. Потребители,
   * которым нужно подготовить место заранее (диапазон скролла), берут её.
   */
  overlayTarget: SharedValue<number>;
  /** Сырая высота клавиатуры (0 — скрыта). */
  keyboardHeight: SharedValue<number>;
  /** Открыта ли клавиатура — синхронное чтение из JS. */
  isKeyboardVisible: () => boolean;
  /** Флаг заморозки для `KeyboardChatScrollView.freeze`. */
  isFrozen: SharedValue<boolean>;
  /** Заморозить зону (перед показом контекстного меню). */
  freeze: () => void;
  /** Разморозить, вернув клавиатуру если она была открыта. Идемпотентно. */
  restore: () => void;
}

export const useKeyboardOverlay = (
  options: IKeyboardOverlayOptions = {},
): IKeyboardOverlay => {
  const { onRefocus, onBlur } = options;

  const safeAreaBottom = useSafeAreaInsets().bottom;
  const keyboard = useKeyboardHeight();

  const liveOverlay = useDerivedValue(
    () => Math.max(keyboard.height.value, safeAreaBottom),
    [safeAreaBottom],
  );

  const liveOverlayTarget = useDerivedValue(
    () => Math.max(keyboard.targetHeight.value, safeAreaBottom),
    [safeAreaBottom],
  );

  const { frozenOverlay, isFrozen, freeze, restore } = useKeyboardFreeze({
    keyboard,
    overlay: liveOverlay,
    onRefocus,
    onBlur,
  });

  // Заморозка держит всю нижнюю зону разом: список, панель ввода и FAB
  // считаются от одного значения, поэтому при скрытии клавиатуры под меню
  // на экране не двигается вообще ничего.
  const overlay = useDerivedValue(() =>
    frozenOverlay.value >= 0 ? frozenOverlay.value : liveOverlay.value,
  );

  // Заморозка держит и цель: пока она активна, готовить место не подо что.
  const overlayTarget = useDerivedValue(() =>
    frozenOverlay.value >= 0 ? frozenOverlay.value : liveOverlayTarget.value,
  );

  return {
    overlay,
    overlayTarget,
    keyboardHeight: keyboard.height,
    isKeyboardVisible: keyboard.isVisible,
    isFrozen,
    freeze,
    restore,
  };
};

/**
 * Нижняя зона плюс высота плавающей панели над ней — суммарное перекрытие
 * контента снизу. Именно это значение уходит в инсет списка и в позицию FAB.
 */
export const useBottomInset = (
  overlay: SharedValue<number>,
  barHeight: SharedValue<number>,
  /** Собственные отступы контента снизу, не связанные с клавиатурой. */
  extraPadding = 0,
): SharedValue<number> =>
  useDerivedValue(
    () => overlay.value + barHeight.value + extraPadding,
    [extraPadding],
  );

/** Высота плавающей панели как shared value — без ре-рендеров потребителей. */
export const useBarHeight = (initial = 0): SharedValue<number> =>
  useSharedValue(initial);
