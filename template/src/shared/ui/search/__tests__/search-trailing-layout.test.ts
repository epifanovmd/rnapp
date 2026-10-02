import { searchTrailingLayout } from "../search-trailing-layout";

describe("searchTrailingLayout", () => {
  const ACCESSORY = 48;
  const CANCEL = 72;

  it("края: вне поиска — аксессуар, в поиске — «Отмена»", () => {
    expect(searchTrailingLayout(0, ACCESSORY, CANCEL)).toEqual({
      width: ACCESSORY,
      accessoryOpacity: 1,
      cancelOpacity: 0,
    });
    expect(searchTrailingLayout(1, ACCESSORY, CANCEL)).toEqual({
      width: CANCEL,
      accessoryOpacity: 0,
      cancelOpacity: 1,
    });
  });

  it("одна зона: ширина — между двумя, без суммы аксессуара и «Отмены»", () => {
    for (const progress of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const { width } = searchTrailingLayout(progress, ACCESSORY, CANCEL);

      expect(width).toBeGreaterThanOrEqual(ACCESSORY);
      expect(width).toBeLessThanOrEqual(CANCEL);
    }
  });

  it("смена по очереди: аксессуар и «Отмена» не видны одновременно", () => {
    for (let step = 0; step <= 20; step++) {
      const layout = searchTrailingLayout(step / 20, ACCESSORY, CANCEL);

      expect(Math.min(layout.accessoryOpacity, layout.cancelOpacity)).toBe(0);
    }
  });

  it("без аксессуара — «Отмена» выезжает с нуля", () => {
    expect(searchTrailingLayout(0.5, 0, CANCEL).width).toBe(CANCEL / 2);
  });

  it("worklet", () => {
    expect(searchTrailingLayout.toString()).toMatch(/["']worklet["']/);
  });
});
