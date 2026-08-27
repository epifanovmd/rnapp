import type { ListMetrics } from "../../model";
import { isListDebugEnabled, listDebug } from "../list-debug";

/** Смещение строки на экране меньше этого не считается заметным. */
const SCREEN_EPSILON = 0.5;

/** Позиция видимой строки на момент снятия якоря. */
interface IScreenEntry {
  key: string;
  position: number;
}

/**
 * Диагностика соседей якоря.
 *
 * Зачем нужна: компенсация держит на месте якорь, но соседи способны уехать
 * относительно него — если их размеры уточнились в том же проходе. Такое
 * смещение и есть видимое мерцание, а по сдвигу якоря его не найти: там всё
 * сходится по построению.
 *
 * Какую проблему решает: меряет не экранную позицию. Между снятием якоря и
 * пересчётом пользователь успевает проскроллить сам, и это движение попало бы в
 * отчёт как ошибка. Смысл имеет только разница между тем, на сколько уехала
 * строка, и тем, на сколько сдвинулся скролл.
 *
 * Собирается только под отладкой: проход по видимым строкам на каждое изменение
 * раскладки в рабочем пути не нужен.
 */
export class ScreenDrift {
  private readonly metrics: ListMetrics;
  private entries: IScreenEntry[] = [];

  constructor(metrics: ListMetrics) {
    this.metrics = metrics;
  }

  /** Запомнить позиции видимых строк — база для поиска уехавших. */
  snapshot(firstIndex: number, viewportEnd: number): void {
    this.entries = [];

    if (!isListDebugEnabled("mvcp")) return;

    const count = this.metrics.getCount();

    for (let index = firstIndex; index < count; index++) {
      const key = this.metrics.getKey(index);

      if (key === undefined) break;

      const position = this.metrics.getPosition(index);

      if (position > viewportEnd) break;

      this.entries.push({ key, position });
    }
  }

  /** Сообщить о строках, уехавших не на ту величину, что и скролл. */
  report(reason: string, applied: number): void {
    const snapshot = this.entries;

    this.entries = [];

    for (const entry of snapshot) {
      const position = this.metrics.getPositionByKey(entry.key);

      if (position === undefined) continue;

      const moved = position - entry.position;
      const drift = moved - applied;

      if (Math.abs(drift) <= SCREEN_EPSILON) continue;

      listDebug("mvcp", "строка уехала на экране", {
        reason,
        key: entry.key,
        moved,
        applied,
        drift,
      });
    }
  }

  clear(): void {
    this.entries = [];
  }
}
