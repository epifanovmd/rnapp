import { useCallback, useEffect, useRef } from "react";
import {
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

/**
 * Величина, которую можно временно «подморозить»: потребители продолжают
 * читать значение, зафиксированное на момент заморозки, пока живое живёт
 * своей жизнью.
 *
 * Нужно там, где на время оверлея часть экрана обязана стоять на месте:
 * оверлей снимает снапшот элемента в его текущей позиции, и если под ним
 * что-то поедет, при закрытии снапшот вернётся мимо цели.
 *
 * ## Отложенная разморозка (главное здесь)
 *
 * Заморозка работает подменой, поэтому момент разморозки — это момент,
 * когда значение скачком принимает живое. Если источник за время заморозки
 * ушёл далеко, отпускать сразу нельзя: будет прыжок.
 *
 * Поэтому `restore()` только помечает намерение и просит источник вернуться
 * (`onRestore`), а подмена снимается реакцией — когда живое значение догнало
 * замороженное и разница стала незаметной. Запасной таймер закрывает случай,
 * когда источник не вернулся вовсе.
 *
 * **Не снимать заморозку синхронно в `restore()`** — это ровно та ошибка,
 * ради которой хук и написан.
 *
 * ## Пример
 *
 * ```ts
 * const { value, freeze, restore } = useFreezableValue({
 *   live: bottomInset,
 *   isSourceActive: () => keyboard.isVisible(),
 *   onFreeze: () => input.blur(),
 *   onRestore: () => input.focus(),
 * });
 * ```
 */

/** Сколько ждём возврата источника, прежде чем разморозить принудительно. */
const DEFAULT_FALLBACK_DELAY = 600;

export interface IFreezableValueOptions {
  /** Живое значение, которое замораживаем. */
  live: SharedValue<number>;
  /**
   * Активен ли источник живого значения. Если да — `freeze()` погасит его
   * через `onFreeze`, а `restore()` вернёт через `onRestore` и дождётся,
   * пока живое значение догонит замороженное. Если нет — размораживаем
   * сразу: живое и так равно замороженному.
   */
  isSourceActive: () => boolean;
  /** Погасить источник при заморозке. */
  onFreeze?: () => void;
  /** Вернуть источник при разморозке. */
  onRestore?: () => void;
  /** Через сколько отпустить, если источник не вернулся (мс). */
  fallbackDelay?: number;
}

export interface IFreezableValue {
  /** Замороженное значение, либо живое когда заморозки нет. */
  value: SharedValue<number>;
  /**
   * Замороженное значение, либо `-1`. Нужно, когда от одной заморозки
   * зависит несколько величин и подменять их надо самостоятельно.
   */
  frozen: SharedValue<number>;
  /** Активна ли заморозка. */
  isFrozen: SharedValue<boolean>;
  freeze: () => void;
  /** Идемпотентно. */
  restore: () => void;
}

export const useFreezableValue = ({
  live,
  isSourceActive,
  onFreeze,
  onRestore,
  fallbackDelay = DEFAULT_FALLBACK_DELAY,
}: IFreezableValueOptions): IFreezableValue => {
  const frozen = useSharedValue(-1);
  const isFrozen = useSharedValue(false);
  /** Источник попросили вернуться — ждём, когда живое догонит. */
  const pendingRestore = useSharedValue(false);

  const sourceWasActiveRef = useRef(false);
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
    frozen.value = -1;
    isFrozen.value = false;
  }, [clearThawTimer, pendingRestore, frozen, isFrozen]);

  const freeze = useCallback(() => {
    if (isFrozen.value) return;

    const wasActive = isSourceActive();

    sourceWasActiveRef.current = wasActive;
    frozen.value = live.value;
    isFrozen.value = true;

    if (wasActive) onFreeze?.();
  }, [isFrozen, isSourceActive, frozen, live, onFreeze]);

  const restore = useCallback(() => {
    if (!isFrozen.value) return;

    const wasActive = sourceWasActiveRef.current;

    sourceWasActiveRef.current = false;

    if (!wasActive) {
      // Источник и не уходил — живое равно замороженному, прыжка нет.
      thaw();

      return;
    }

    pendingRestore.value = true;
    onRestore?.();

    clearThawTimer();
    thawTimerRef.current = setTimeout(thaw, fallbackDelay);
  }, [
    isFrozen,
    pendingRestore,
    onRestore,
    clearThawTimer,
    thaw,
    fallbackDelay,
  ]);

  // Живое догнало замороженное — подмену можно снимать незаметно.
  useAnimatedReaction(
    () => pendingRestore.value && live.value >= frozen.value - 1,
    reached => {
      if (reached) {
        pendingRestore.value = false;
        scheduleOnRN(thaw);
      }
    },
  );

  useEffect(() => clearThawTimer, [clearThawTimer]);

  const value = useDerivedValue(() =>
    frozen.value >= 0 ? frozen.value : live.value,
  );

  return { value, frozen, isFrozen, freeze, restore };
};
