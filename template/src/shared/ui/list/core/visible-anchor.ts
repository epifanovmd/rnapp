import type { ListMetrics } from "../model";

export interface IVisibleAnchorOptions {
  metrics: ListMetrics;
  /** Разрешён ли элемент как якорь восстановления. */
  shouldRestorePosition?: (index: number) => boolean;
}

/** Смещение меньше этого не компенсируется. */
const POSITION_EPSILON = 0.1;
/** Пока идёт серия изменений, якорь не переключается, мс. */
const ANCHOR_LOCK_TTL_MS = 300;
/** Столько проходов без смещения освобождают якорь. */
const QUIET_PASSES_TO_RELEASE = 2;

/**
 * Якорь видимой позиции.
 *
 * Запоминает элемент, который пользователь видит, и его позицию до изменения
 * раскладки. После пересчёта разница позиций якоря — это то, на сколько уехал
 * контент, и ровно на столько нужно подвинуть скролл.
 *
 * Якорь удерживается на время серии изменений: пока подгрузка идёт пачками,
 * переключение на другой элемент означало бы измерять смещение относительно
 * того, что само едет. Освобождается после нескольких проходов без смещения.
 */
export class VisibleAnchor {
  private readonly options: IVisibleAnchorOptions;

  private key: string | undefined;
  private position = 0;
  private lockedUntil = 0;
  private quietPasses = 0;

  constructor(options: IVisibleAnchorOptions) {
    this.options = options;
  }

  /**
   * Запомнить якорь в текущем диапазоне.
   *
   * Берётся первый элемент с известным размером: у неизмеренного позиция
   * оценочная, и восстанавливать по ней нечего.
   */
  capture(startIndex: number, endIndex: number): void {
    const { metrics, shouldRestorePosition } = this.options;

    if (this.isLocked() && this.key !== undefined) {
      this.position = metrics.getPositionByKey(this.key) ?? this.position;

      return;
    }

    for (let index = startIndex; index <= endIndex; index++) {
      const key = metrics.getKey(index);

      if (key === undefined || !metrics.hasMeasured(key)) continue;
      if (shouldRestorePosition && !shouldRestorePosition(index)) continue;

      this.key = key;
      this.position = metrics.getPosition(index);

      return;
    }

    this.key = undefined;
  }

  /**
   * Насколько уехал якорь с момента запоминания. Возвращает 0, если якоря нет
   * или он исчез из данных.
   */
  measureShift(): number {
    const { metrics } = this.options;

    if (this.key === undefined) return 0;

    const current = metrics.getPositionByKey(this.key);

    if (current === undefined) {
      this.key = undefined;

      return 0;
    }

    const shift = current - this.position;

    this.position = current;

    if (Math.abs(shift) <= POSITION_EPSILON) {
      this.quietPasses += 1;

      if (this.quietPasses >= QUIET_PASSES_TO_RELEASE) this.release();

      return 0;
    }

    this.quietPasses = 0;
    this.lockedUntil = Date.now() + ANCHOR_LOCK_TTL_MS;

    return shift;
  }

  private isLocked(): boolean {
    return Date.now() < this.lockedUntil;
  }

  release(): void {
    this.key = undefined;
    this.lockedUntil = 0;
    this.quietPasses = 0;
  }
}
