/** Изменение измеренной высоты меньше этого — шум округления экрана. */
const MEASURE_EPSILON = 1;

/**
 * Сколько замеров набирает средний размер по типу, прежде чем замереть.
 *
 * Среднее нужно, только чтобы прикинуть высоту ещё не отрисованных строк, и
 * после нескольких десятков замеров точнее оно уже не станет. А вот меняться не
 * перестаёт — и каждое изменение переставляет разом все неизмеренные строки:
 * суммарная высота контента гуляет на сотни пикселей, отведённое строке место
 * расходится с тем, чем она нарисована, и между строками то появляется, то
 * пропадает пустая полоса. Поэтому среднее фиксируется.
 */
const AVERAGE_SAMPLE_LIMIT = 32;

/** Средний измеренный размер по типу элемента. */
interface IAverage {
  sum: number;
  count: number;
}

export interface IListMetricsOptions {
  estimatedItemSize: number;
}

/**
 * Размеры и позиции элементов.
 *
 * Позиции — префиксные суммы, пересчитываемые лениво от первого «грязного»
 * индекса: измерение одной ячейки не должно стоить прохода по всему списку.
 * Размеры привязаны к ключу, а не к индексу, поэтому переживают вставки,
 * удаления и перестановки данных.
 */
export class ListMetrics {
  private keys: string[] = [];
  private types: string[] = [];
  private indexByKey = new Map<string, number>();

  /** Измеренные размеры; ключ переживает смену данных. */
  private measured = new Map<string, number>();
  /** Размеры, объявленные через `getFixedItemSize` — измерять их не нужно. */
  private fixed = new Map<string, number>();
  /**
   * Элементы, появившиеся в данных и ещё не измеренные.
   *
   * Места они не занимают вовсе. Отвести им место по среднему — значит на кадр
   * развести отведённое и нарисованное: строка рисуется своей высотой, а слот
   * под ней другой, и на стыке видна пустая полоса, которая схлопывается
   * следующим кадром вместе со скроллом. Нулевой слот убирает и полосу, и
   * лишний сдвиг: раскладка не меняется, пока размеры не известны.
   */
  private pending = new Set<string>();
  private averageByType = new Map<string, IAverage>();

  private positions: number[] = [];
  /** С какого индекса префиксные суммы устарели. */
  private dirtyFrom = 0;
  private total = 0;

  private readonly estimatedItemSize: number;

  constructor({ estimatedItemSize }: IListMetricsOptions) {
    this.estimatedItemSize = estimatedItemSize;
  }

  /**
   * Привязка к новым данным. Возвращает индекс, с которого раскладка поехала:
   * до него позиции остались прежними и пересчёт не нужен.
   */
  setItems(keys: string[], types: string[]): number {
    const divergedAt = this.findDivergence(keys);

    this.keys = keys;
    this.types = types;
    this.indexByKey.clear();
    for (let i = 0; i < keys.length; i++) {
      this.indexByKey.set(keys[i]!, i);
    }

    this.markDirty(divergedAt);

    return divergedAt;
  }

  /** Первый индекс, где новый порядок ключей расходится со старым. */
  private findDivergence(next: string[]): number {
    const min = Math.min(this.keys.length, next.length);

    for (let i = 0; i < min; i++) {
      if (this.keys[i] !== next[i]) return i;
    }

    return min;
  }

  /** Размер, объявленный пропом: элемент не участвует в измерении. */
  setFixedSize(key: string, size: number): void {
    if (this.fixed.get(key) === size) return;

    this.fixed.set(key, size);
    this.markDirty(this.indexByKey.get(key) ?? 0);
  }

  /**
   * Поедет ли раскладка от такого измерения.
   *
   * Разница меньше пикселя игнорируется. iOS округляет кадр к сетке экрана, и
   * одна и та же ячейка на дробной позиции даёт высоту, гуляющую на доли
   * пикселя. Принимать такое измерение — значит пересчитать раскладку, сдвинуть
   * позицию, получить новое округление и следующее измерение: замкнутый цикл,
   * видимый как постоянная мелкая дрожь.
   */
  willResize(key: string, size: number): boolean {
    if (this.fixed.has(key)) return false;

    const previous = this.measured.get(key);

    return (
      previous === undefined || Math.abs(previous - size) >= MEASURE_EPSILON
    );
  }

  /**
   * Результат измерения ячейки. Возвращает true, если раскладка изменилась.
   *
   * Объявленный размер измерением не перебивается: фактическая высота приходит
   * округлённой к пикселям устройства и отличается от заявленной на доли
   * пикселя. Каждое такое расхождение сдвигало бы все позиции ниже и
   * перерисовывало контейнеры — на глаз это дрожание при прокрутке.
   */
  setMeasuredSize(key: string, size: number): boolean {
    if (this.fixed.has(key)) return false;

    const previous = this.measured.get(key);

    if (previous === size) return false;

    this.measured.set(key, size);
    this.pending.delete(key);
    this.updateAverage(key, previous, size);
    this.markDirty(this.indexByKey.get(key) ?? 0);

    return true;
  }

  private updateAverage(
    key: string,
    previous: number | undefined,
    size: number,
  ): void {
    const index = this.indexByKey.get(key);
    const type = index === undefined ? "" : (this.types[index] ?? "");
    const average = this.averageByType.get(type) ?? { sum: 0, count: 0 };

    // Набранное среднее больше не трогаем: уточнять его нечем, а переставлять
    // из-за него все неизмеренные строки — значит двигать раскладку впустую.
    if (average.count >= AVERAGE_SAMPLE_LIMIT) return;

    if (previous === undefined) {
      average.sum += size;
      average.count += 1;
    } else {
      average.sum += size - previous;
    }

    this.averageByType.set(type, average);
  }

  hasMeasured(key: string): boolean {
    return this.measured.has(key) || this.fixed.has(key);
  }

  /** Элемент ждёт первого измерения и места пока не занимает. */
  isPending(key: string): boolean {
    return this.pending.has(key);
  }

  /**
   * Индексы ожидающих элементов.
   *
   * Их обязан отрисовать список: измерить неотрисованное нечем, а нулевой слот
   * схлопывает их в одну точку — сами в диапазон отрисовки они не попадут и
   * останутся нулевыми навсегда.
   */
  getPendingIndices(): number[] {
    const indices: number[] = [];

    for (const key of this.pending) {
      const index = this.indexByKey.get(key);

      if (index !== undefined) indices.push(index);
    }

    return indices;
  }

  /** Пометить появившийся элемент: до измерения он не занимает места. */
  markPending(key: string): void {
    if (this.hasMeasured(key) || this.pending.has(key)) return;

    this.pending.add(key);
    this.markDirty(this.indexByKey.get(key) ?? 0);
  }

  /**
   * Вернуть ожидающим элементам обычный размер.
   *
   * Ждать измерения бесконечно нельзя: до элемента могли не дойти — он вне
   * буфера отрисовки, — и тогда список считал бы его нулевым, а суммарную
   * высоту контента заниженной.
   */
  clearPending(): void {
    if (this.pending.size === 0) return;

    let first = this.keys.length;

    for (const key of this.pending) {
      const index = this.indexByKey.get(key);

      if (index !== undefined && index < first) first = index;
    }

    this.pending.clear();
    this.markDirty(first);
  }

  /**
   * Размер элемента: измеренный, объявленный, средний по типу или оценка.
   * Средний по типу точнее общей оценки — разнородные ячейки (текст, фото)
   * иначе тянут раскладку друг друга.
   */
  getSize(index: number): number {
    const key = this.keys[index];

    if (key === undefined) return this.estimatedItemSize;
    if (this.pending.has(key)) return 0;

    const known = this.measured.get(key) ?? this.fixed.get(key);

    if (known !== undefined) return known;

    const average = this.averageByType.get(this.types[index] ?? "");

    if (average !== undefined && average.count > 0) {
      return average.sum / average.count;
    }

    return this.estimatedItemSize;
  }

  getSizeByKey(key: string): number | undefined {
    return this.measured.get(key) ?? this.fixed.get(key);
  }

  private markDirty(index: number): void {
    if (index < this.dirtyFrom) this.dirtyFrom = index;
  }

  /** Пересчёт устаревших префиксных сумм. */
  flush(): void {
    const count = this.keys.length;

    // Позиции целы, но хвост мог укоротиться — суммарный размер считается по
    // последнему оставшемуся элементу, иначе он держит высоту удалённых.
    if (this.dirtyFrom >= count) {
      this.dirtyFrom = count;
      this.positions.length = count;
      this.total =
        count === 0 ? 0 : this.positions[count - 1]! + this.getSize(count - 1);

      return;
    }

    let position =
      this.dirtyFrom === 0
        ? 0
        : this.positions[this.dirtyFrom - 1]! +
          this.getSize(this.dirtyFrom - 1);

    for (let i = this.dirtyFrom; i < count; i++) {
      this.positions[i] = position;
      position += this.getSize(i);
    }

    this.positions.length = count;
    this.total = position;
    this.dirtyFrom = count;
  }

  getPosition(index: number): number {
    this.flush();

    return this.positions[index] ?? 0;
  }

  getPositionByKey(key: string): number | undefined {
    const index = this.indexByKey.get(key);

    return index === undefined ? undefined : this.getPosition(index);
  }

  getTotalSize(): number {
    this.flush();

    return this.total;
  }

  getIndexByKey(key: string): number | undefined {
    return this.indexByKey.get(key);
  }

  getKey(index: number): string | undefined {
    return this.keys[index];
  }

  getCount(): number {
    return this.keys.length;
  }

  /** Последний элемент, начинающийся не ниже смещения. Бинарный поиск. */
  findIndexAtOffset(offset: number): number {
    this.flush();

    const count = this.positions.length;

    if (count === 0) return 0;

    let low = 0;
    let high = count - 1;

    while (low < high) {
      const mid = Math.floor((low + high + 1) / 2);

      if (this.positions[mid]! <= offset) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }

    return low;
  }
}
