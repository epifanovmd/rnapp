import { getItemScrollOffset } from "../item-offset";

const SCROLL_LENGTH = 500;

describe("getItemScrollOffset", () => {
  it("по умолчанию прижимает элемент к началу вьюпорта", () => {
    expect(
      getItemScrollOffset({
        position: 1000,
        size: 100,
        scrollLength: SCROLL_LENGTH,
      }),
    ).toBe(1000);
  });

  it("прижимает элемент к концу вьюпорта", () => {
    // Низ элемента совпадает с низом вьюпорта: 1000 + 100 - 500.
    expect(
      getItemScrollOffset({
        position: 1000,
        size: 100,
        scrollLength: SCROLL_LENGTH,
        viewPosition: 1,
      }),
    ).toBe(600);
  });

  it("ставит элемент по центру вьюпорта", () => {
    expect(
      getItemScrollOffset({
        position: 1000,
        size: 100,
        scrollLength: SCROLL_LENGTH,
        viewPosition: 0.5,
      }),
    ).toBe(800);
  });

  it("сдвигает результат на дополнительный отступ", () => {
    // Навбар поверх списка: элемент обязан оказаться под ним, а не за ним.
    expect(
      getItemScrollOffset({
        position: 1000,
        size: 100,
        scrollLength: SCROLL_LENGTH,
        viewOffset: 60,
      }),
    ).toBe(940);
  });

  it("не уходит выше начала контента", () => {
    // Отрицательное смещение нативный слой подтянет к нулю, но диапазон
    // отрисовки успел бы посчитаться по несуществующей позиции.
    expect(
      getItemScrollOffset({
        position: 20,
        size: 100,
        scrollLength: SCROLL_LENGTH,
        viewOffset: 200,
      }),
    ).toBe(0);
  });
});
