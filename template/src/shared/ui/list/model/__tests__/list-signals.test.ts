import { INITIAL_SIGNALS, POSITION_OUT_OF_VIEW } from "../list-signals";

describe("сигналы списка", () => {
  it("считает список стоящим в начале до первой раскладки", () => {
    expect(INITIAL_SIGNALS.isAtStart).toBe(true);
    expect(INITIAL_SIGNALS.isNearStart).toBe(true);
    expect(INITIAL_SIGNALS.isAtEnd).toBe(false);
    expect(INITIAL_SIGNALS.isNearEnd).toBe(false);
  });

  it("не показывает список до первого готового кадра", () => {
    // Иначе виден скачок с оценочных размеров на измеренные.
    expect(INITIAL_SIGNALS.readyToRender).toBe(false);
  });

  it("начинает без контента, контейнеров и компенсации", () => {
    expect(INITIAL_SIGNALS.totalSize).toBe(0);
    expect(INITIAL_SIGNALS.numContainers).toBe(0);
    expect(INITIAL_SIGNALS.scrollAdjust).toBe(0);
    expect(INITIAL_SIGNALS.scrollLength).toBe(0);
  });

  it("считает, что якорей прилипания нет", () => {
    expect(INITIAL_SIGNALS.activeStickyStartIndex).toBe(-1);
    expect(INITIAL_SIGNALS.activeStickyEndIndex).toBe(-1);
  });

  it("уводит контейнер туда, куда скролл не доходит", () => {
    // Контейнер без привязки не размонтируется — он ждёт следующего элемента.
    expect(POSITION_OUT_OF_VIEW).toBeLessThan(-1000000);
  });
});
