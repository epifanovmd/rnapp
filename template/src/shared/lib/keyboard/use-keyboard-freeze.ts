import { useCallback, useEffect, useRef } from "react";
import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { IKeyboardHeight } from "./use-keyboard-height";

/**
 * Порт `KeyboardFreezeManager` из IOSChatView.
 *
 * Пока открыто контекстное меню, нижняя зона экрана обязана стоять на месте:
 * меню снимает снапшот пузыря в его текущей позиции, поэтому уезжающая
 * клавиатура не должна двигать ни список, ни панель ввода — иначе при
 * закрытии меню пузырь прилетит мимо своей ячейки.
 *
 * Эталонная последовательность:
 * - `freeze()` — запомнить текущую зону и то, была ли открыта клавиатура,
 *   после чего убрать клавиатуру (именно blur, а не `Keyboard.dismiss`:
 *   последний прячет клавиатуру, не снимая фокус, и обратный `focus()`
 *   на Android тогда ничего не делает).
 * - `restore()` — вернуть клавиатуру, но отпустить зону только когда она
 *   полностью открыта, иначе будет прыжок.
 *
 * SRP: хук управляет только заморозкой. Что именно заморожено (инсет списка,
 * трансформация панели) — забота потребителей, которые читают `frozenOverlay`
 * и `isFrozen`.
 *
 * ## Почему разморозка отложенная (важно, не упрощать)
 *
 * Заморозка работает подменой значения: пока она активна, потребители
 * читают `frozenOverlay` вместо живой зоны. Значит момент разморозки — это
 * момент, когда зона скачком принимает живое значение.
 *
 * Если разморозить сразу по закрытию меню, клавиатура ещё не вернулась,
 * живая зона равна safe area — и панель со списком мгновенно прыгают вниз,
 * а через кадр начинают ехать обратно вверх за клавиатурой. Поэтому
 * `restore()` только помечает намерение и возвращает фокус, а снимает
 * заморозку реакция — когда клавиатура физически доехала до прежней высоты
 * и подмена стала неотличима от живого значения.
 *
 * Запасной таймер закрывает случай, когда клавиатура не вернулась вовсе
 * (фокус перехватила модалка, ушли с экрана): там живая высота
 * действительно равна safe area, и переход к ней корректен.
 *
 * **Не снимать заморозку синхронно в `restore()`.**
 */

/** Сколько ждём возврата клавиатуры, прежде чем разморозить принудительно. */
const THAW_FALLBACK_DELAY = 600;

export interface IKeyboardFreezeOptions {
  keyboard: IKeyboardHeight;
  /** Живое значение нижней зоны — его и запоминаем на момент заморозки. */
  overlay: SharedValue<number>;
  /** Вернуть фокус в поле ввода (панель ввода даёт свой `focus`). */
  onRefocus?: () => void;
  /** Убрать фокус с поля ввода. */
  onBlur?: () => void;
}

export interface IKeyboardFreeze {
  /**
   * Замороженное значение зоны, либо `-1` когда заморозки нет.
   * Потребители подставляют его вместо живого — и замирают все разом.
   */
  frozenOverlay: SharedValue<number>;
  /**
   * Флаг для `KeyboardChatScrollView.freeze`: пока `true`, список
   * не реагирует на движение клавиатуры.
   */
  isFrozen: SharedValue<boolean>;
  /** Заморозить зону (перед показом контекстного меню). */
  freeze: () => void;
  /** Разморозить, вернув клавиатуру если она была открыта. Идемпотентно. */
  restore: () => void;
}

export const useKeyboardFreeze = ({
  keyboard,
  overlay,
  onRefocus,
  onBlur,
}: IKeyboardFreezeOptions): IKeyboardFreeze => {
  const frozenOverlay = useSharedValue(-1);
  const isFrozen = useSharedValue(false);
  /** Клавиатуру попросили вернуться — ждём, когда она доедет до прежней высоты. */
  const pendingRestore = useSharedValue(false);

  const keyboardWasVisibleRef = useRef(false);
  const thawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearThawTimer = useCallback(() => {
    if (thawTimerRef.current) {
      clearTimeout(thawTimerRef.current);
      thawTimerRef.current = null;
    }
  }, []);

  const thaw = useCallback(() => {
    clearThawTimer();
    pendingRestore.value = false;
    frozenOverlay.value = -1;
    isFrozen.value = false;
  }, [clearThawTimer, pendingRestore, frozenOverlay, isFrozen]);

  // Порт freeze(): запоминаем зону и то, была ли открыта клавиатура.
  const freeze = useCallback(() => {
    if (isFrozen.value) return;

    const wasVisible = keyboard.isVisible();

    keyboardWasVisibleRef.current = wasVisible;
    frozenOverlay.value = overlay.value;
    isFrozen.value = true;

    if (wasVisible) onBlur?.();
  }, [isFrozen, keyboard, frozenOverlay, overlay, onBlur]);

  // Порт restore(): клавиатуру возвращаем, зону отпускаем только когда она
  // снова полностью открыта — иначе зона схлопнется раньше клавиатуры.
  const restore = useCallback(() => {
    if (!isFrozen.value) return;

    const wasVisible = keyboardWasVisibleRef.current;

    keyboardWasVisibleRef.current = false;

    if (!wasVisible) {
      // Зона заморожена на safe area — живое значение такое же, прыжка нет.
      thaw();

      return;
    }

    pendingRestore.value = true;
    onRefocus?.();

    // Страховка: если клавиатуру вернуть не удалось (фокус перехватила
    // модалка, действие увело с экрана), зона не должна остаться замороженной
    // навсегда.
    clearThawTimer();
    thawTimerRef.current = setTimeout(thaw, THAW_FALLBACK_DELAY);
  }, [isFrozen, pendingRestore, onRefocus, clearThawTimer, thaw]);

  // Порт thaw по keyboardDidShow: клавиатура доехала обратно на ту же высоту,
  // на которой была зафиксирована зона, — значит подмена стала незаметной
  // и живое значение можно возвращать.
  useAnimatedReaction(
    () => pendingRestore.value && keyboard.height.value >= frozenOverlay.value,
    reached => {
      if (reached) {
        pendingRestore.value = false;
        scheduleOnRN(thaw);
      }
    },
  );

  useEffect(() => clearThawTimer, [clearThawTimer]);

  return { frozenOverlay, isFrozen, freeze, restore };
};
