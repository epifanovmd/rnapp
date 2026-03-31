import { formatter } from "@utils";
import { useEffect, useReducer, useRef } from "react";

/**
 * Возвращает отформатированную относительную строку времени ("3 минуты назад"),
 * которая автоматически обновляется по таймеру.
 *
 * Интервал обновления адаптивный:
 * - < 1 часа  → каждые 30 секунд
 * - < 1 дня   → каждые 5 минут
 * - >= 1 дня  → каждые 1 час
 */
export function useRelativeTime(isoString: string | null | undefined): string {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isoString) return;

    const schedule = () => {
      const diffMs = Date.now() - new Date(isoString).getTime();

      let intervalMs: number;

      if (diffMs < 60 * 60 * 1000) {
        intervalMs = 30_000; // < 1 часа → 30с
      } else if (diffMs < 24 * 60 * 60 * 1000) {
        intervalMs = 5 * 60_000; // < 1 дня → 5 мин
      } else {
        intervalMs = 60 * 60_000; // >= 1 дня → 1 час
      }

      timerRef.current = setTimeout(() => {
        forceUpdate();
        schedule();
      }, intervalMs);
    };

    schedule();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isoString]);

  return formatter.date.formatDiff(isoString);
}
