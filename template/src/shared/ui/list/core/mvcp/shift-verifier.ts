import { isListDebugEnabled, listDebug } from "../list-debug";
import type { ScrollAdapterRef } from "../scroll";

/** Через столько кадров сверяется фактически применённый сдвиг. */
const VERIFY_FRAMES = 2;

/**
 * Сверка фактически применённого сдвига.
 *
 * Зачем нужна: единственная честная проверка компенсации. Нативное смещение
 * обязано измениться ровно на то, что мы запросили, и `error` — это пиксели,
 * на которые контент уехал на глазах у пользователя. Значение врёт только при
 * живом жесте: туда попадает и то, что пользователь проскроллил сам.
 *
 * Только под отладкой: чтение shared value из JS ходит на UI-поток и блокирует
 * вызывающего, в рабочем пути такому не место.
 */
export const verifyShift = (
  adapter: ScrollAdapterRef,
  applied: number,
): void => {
  if (!isListDebugEnabled("mvcp")) return;

  const before = adapter()?.getOffset?.();

  if (before === undefined) return;

  let frames = 0;

  const tick = () => {
    if (++frames < VERIFY_FRAMES) {
      requestAnimationFrame(tick);

      return;
    }

    const after = adapter()?.getOffset?.();

    if (after === undefined) return;

    listDebug("mvcp", "проверка", {
      applied,
      before,
      after,
      realized: after - before,
      error: after - before - applied,
    });
  };

  requestAnimationFrame(tick);
};
