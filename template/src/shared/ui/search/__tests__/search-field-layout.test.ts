import { searchFieldLayout } from "../search-field-layout";

describe("searchFieldLayout", () => {
  it("свёрнуто — ширина кнопки, невидимо", () => {
    expect(searchFieldLayout(0, 360, 44)).toEqual({ width: 44, opacity: 0 });
  });

  it("раскрыто — на всю ширину", () => {
    expect(searchFieldLayout(1, 360, 44)).toEqual({ width: 360, opacity: 1 });
  });

  it("панель проявляется в первой трети пути", () => {
    expect(searchFieldLayout(0.4, 360, 44).opacity).toBe(1);
    expect(searchFieldLayout(0.1, 360, 44).opacity).toBeCloseTo(0.3);
  });

  it("объявлен как worklet", () => {
    expect(searchFieldLayout.toString()).toMatch(/["']worklet["']/);
  });
});
