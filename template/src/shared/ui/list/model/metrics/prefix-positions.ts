export interface IPrefixPositionsOptions {
  getCount: () => number;
  getSize: (index: number) => number;
}

/**
 * Позиции элементов как префиксные суммы их размеров.
 *
 * Зачем нужны: позиция строки — это сумма высот всех строк выше неё. Считать её
 * заново на каждое обращение значит проходить весь список на каждый кадр
 * скролла.
 *
 * Какую проблему решает: пересчёт ленивый и частичный — от первого «грязного»
 * индекса и до конца. Измерение одной ячейки в середине не стоит прохода по
 * всему списку сверху, а обновление данных с совпадающим префиксом не стоит
 * вообще ничего.
 */
export class PrefixPositions {
  private readonly options: IPrefixPositionsOptions;

  private positions: number[] = [];
  /** С какого индекса префиксные суммы устарели. */
  private dirtyFrom = 0;
  private total = 0;

  constructor(options: IPrefixPositionsOptions) {
    this.options = options;
  }

  /** Отметить, что с этого индекса позиции поехали. */
  markDirty(index: number): void {
    if (index < this.dirtyFrom) this.dirtyFrom = index;
  }

  /** Пересчёт устаревших префиксных сумм. */
  flush(): void {
    const count = this.options.getCount();

    // Позиции целы, но хвост мог укоротиться — суммарный размер считается по
    // последнему оставшемуся элементу, иначе он держит высоту удалённых.
    if (this.dirtyFrom >= count) {
      this.dirtyFrom = count;
      this.positions.length = count;
      this.total =
        count === 0
          ? 0
          : this.positions[count - 1]! + this.options.getSize(count - 1);

      return;
    }

    let position =
      this.dirtyFrom === 0
        ? 0
        : this.positions[this.dirtyFrom - 1]! +
          this.options.getSize(this.dirtyFrom - 1);

    for (let index = this.dirtyFrom; index < count; index++) {
      this.positions[index] = position;
      position += this.options.getSize(index);
    }

    this.positions.length = count;
    this.total = position;
    this.dirtyFrom = count;
  }

  getPosition(index: number): number {
    this.flush();

    return this.positions[index] ?? 0;
  }

  /** Полная высота всех элементов, без шапки, подвала и распорок. */
  getTotal(): number {
    this.flush();

    return this.total;
  }

  /**
   * Последний элемент, начинающийся не ниже смещения. Бинарный поиск.
   *
   * С него начинается обход диапазона отрисовки: линейный поиск с нуля стоил бы
   * прохода по всему списку на каждом кадре скролла.
   */
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
