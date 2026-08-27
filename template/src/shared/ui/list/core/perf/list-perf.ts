/**
 * Счётчики производительности списка.
 *
 * Зачем нужны: узкие места списка не видно только по частоте кадров. Пустая
 * область в кадре, промахи пула, лишние пересчёты раскладки и рендеры
 * контейнеров — каждое из них проявляется одинаково, «подтормаживает», а
 * лечится по-разному.
 *
 * Выключены по умолчанию: замер сам стоит работы, а часть величин требует
 * прохода по видимым элементам на каждом пересчёте.
 */
export type ListPerfCounter =
  /** Рендер контейнера — самая дорогая работа на скролле. */
  | "render"
  /** Пересчёт диапазона и раскладки. */
  | "layout"
  /** Смена привязки контейнера к элементу. */
  | "bind"
  /** Пул выдал новый контейнер: свободных не было. */
  | "poolNew"
  /** Пул отдал контейнер под чужой тип: поддерево перемонтируется. */
  | "poolMiss"
  /** Измерение строки. */
  | "measure"
  /** Компенсация позиции. */
  | "shift";

const COUNTERS: ListPerfCounter[] = [
  "render",
  "layout",
  "bind",
  "poolNew",
  "poolMiss",
  "measure",
  "shift",
];

export interface IListPerfSnapshot {
  counters: Record<ListPerfCounter, number>;
  /** Незакрытая контейнерами часть вьюпорта сейчас, px. */
  blankNow: number;
  /** Худшая незакрытая часть за время замера, px. */
  blankMax: number;
  /** Худший разрыв между событиями скролла, мс. */
  scrollGapMax: number;
  /** Контейнеров в пуле. */
  containers: number;
  /** Длительность замера, мс. */
  elapsedMs: number;
}

const emptyCounters = (): Record<ListPerfCounter, number> => ({
  render: 0,
  layout: 0,
  bind: 0,
  poolNew: 0,
  poolMiss: 0,
  measure: 0,
  shift: 0,
});

/**
 * Накопитель замеров.
 *
 * Часы приходят снаружи: тестам нужно управлять временем, а не ждать его.
 */
export class ListPerfStats {
  private readonly now: () => number;
  private counters = emptyCounters();
  private startedAt: number;
  private blank = 0;
  private blankMax = 0;
  private scrollGapMax = 0;
  private lastScrollAt: number | undefined;
  private containers = 0;

  constructor(now: () => number = Date.now) {
    this.now = now;
    this.startedAt = now();
  }

  count(counter: ListPerfCounter, amount = 1): void {
    this.counters[counter] += amount;
  }

  /** Незакрытая часть вьюпорта на текущем пересчёте. */
  setBlank(value: number): void {
    this.blank = value;
    this.blankMax = Math.max(this.blankMax, value);
  }

  setContainers(value: number): void {
    this.containers = value;
  }

  /**
   * Отметка события скролла.
   *
   * Пропущенные кадры доставки видно только по времени между событиями: сами
   * смещения при этом остаются верными.
   */
  markScroll(): void {
    const now = this.now();

    if (this.lastScrollAt !== undefined) {
      this.scrollGapMax = Math.max(this.scrollGapMax, now - this.lastScrollAt);
    }

    this.lastScrollAt = now;
  }

  snapshot(): IListPerfSnapshot {
    return {
      counters: { ...this.counters },
      blankNow: this.blank,
      blankMax: this.blankMax,
      scrollGapMax: this.scrollGapMax,
      containers: this.containers,
      elapsedMs: this.now() - this.startedAt,
    };
  }

  reset(): void {
    this.counters = emptyCounters();
    this.startedAt = this.now();
    this.blank = 0;
    this.blankMax = 0;
    this.scrollGapMax = 0;
    this.lastScrollAt = undefined;
  }
}

/** Счётчики в секунду — по ним видно нагрузку, а не пройденный путь. */
export const getPerfRates = (
  snapshot: IListPerfSnapshot,
): Record<ListPerfCounter, number> => {
  const seconds = snapshot.elapsedMs / 1000;
  const rates = emptyCounters();

  for (const counter of COUNTERS) {
    rates[counter] =
      seconds > 0 ? Math.round(snapshot.counters[counter] / seconds) : 0;
  }

  return rates;
};

let stats: ListPerfStats | undefined;

/** Включение замера: без него счётчики не тратят ни такта. */
export const setListPerf = (enabled: boolean): void => {
  stats = enabled ? new ListPerfStats() : undefined;
};

export const isListPerfEnabled = (): boolean => stats !== undefined;

export const listPerfCount = (counter: ListPerfCounter, amount = 1): void => {
  stats?.count(counter, amount);
};

export const listPerfBlank = (value: number): void => stats?.setBlank(value);

export const listPerfContainers = (value: number): void =>
  stats?.setContainers(value);

export const listPerfScroll = (): void => stats?.markScroll();

export const listPerfSnapshot = (): IListPerfSnapshot | undefined =>
  stats?.snapshot();

export const resetListPerf = (): void => stats?.reset();
