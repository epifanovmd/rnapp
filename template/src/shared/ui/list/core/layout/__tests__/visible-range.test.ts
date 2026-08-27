import { ListMetrics } from "../../../model";
import { computeVisibleRange, EMPTY_RANGE } from "../visible-range";

const ITEM_SIZE = 100;
const SCROLL_LENGTH = 500;

const createMetrics = (count = 40, sizes?: number[]) => {
  const metrics = new ListMetrics({ estimatedItemSize: ITEM_SIZE });
  const keys = Array.from({ length: count }, (_, index) => `k${index}`);

  metrics.setItems(
    keys,
    keys.map(() => ""),
  );

  if (sizes)
    keys.forEach((key, index) => metrics.setFixedSize(key, sizes[index]!));

  return metrics;
};

const range = (metrics: ListMetrics, scroll: number, drawDistance = 0) =>
  computeVisibleRange({
    metrics,
    scroll,
    scrollLength: SCROLL_LENGTH,
    drawDistance,
  });

describe("computeVisibleRange", () => {
  it("отдаёт пустой диапазон на пустом списке", () => {
    const metrics = createMetrics(0);

    expect(range(metrics, 0)).toEqual(EMPTY_RANGE);
  });

  it("находит элементы, пересёкшие вьюпорт", () => {
    const metrics = createMetrics();

    // Вьюпорт 1000..1500 — это k10..k14; k15 начинается ровно на кромке и
    // видимым не считается, но контейнер под него уже держится.
    expect(range(metrics, 1000)).toEqual({
      start: 10,
      end: 14,
      startBuffered: 10,
      endBuffered: 15,
    });
  });

  it("считает видимой частично попавшую строку", () => {
    const metrics = createMetrics();

    // Вьюпорт 1050..1550: у k10 виден низ, у k15 — верх.
    expect(range(metrics, 1050)).toMatchObject({ start: 10, end: 15 });
  });

  it("расширяет диапазон буфером по обе стороны", () => {
    const metrics = createMetrics();

    // Элемент монтируется и измеряется заранее, к моменту прихода скролла.
    expect(range(metrics, 1000, 250)).toEqual({
      start: 10,
      end: 14,
      startBuffered: 7,
      endBuffered: 17,
    });
  });

  it("не уходит буфером выше начала контента", () => {
    const metrics = createMetrics();

    expect(range(metrics, 0, 250)).toMatchObject({
      start: 0,
      startBuffered: 0,
    });
  });

  it("не уходит буфером за конец контента", () => {
    const metrics = createMetrics(20);

    expect(range(metrics, 1500, 250)).toMatchObject({
      end: 19,
      endBuffered: 19,
    });
  });

  it("держит пустой видимый диапазон, когда вьюпорт за пределами контента", () => {
    const metrics = createMetrics(5);

    // Скролл ушёл ниже всего контента: буфер есть, видимого нет.
    const result = range(metrics, 5000);

    expect(result.end).toBeLessThan(result.start);
    expect(result.startBuffered).toBe(4);
  });

  it("справляется с разнородными высотами", () => {
    const metrics = createMetrics(5, [50, 400, 30, 900, 100]);

    // Вьюпорт 400..900: k1 кончается на 450, k2 — 480, k3 идёт до 1380.
    expect(range(metrics, 400)).toMatchObject({ start: 1, end: 3 });
  });

  it("схлопывает нулевые строки в одну точку", () => {
    const metrics = createMetrics(4, [100, 0, 0, 100]);

    // Ожидающие измерения места не занимают: сами в диапазон они не попадут.
    expect(range(metrics, 0)).toMatchObject({ start: 0, end: 3 });
  });
});
