import { tooltipRowLayout } from "../tooltip-row-layout";

const metrics = {
  paddingX: 6,
  paddingY: 3,
  rowHeight: 18,
  dotRadius: 4,
  fontSize: 12,
};

describe("tooltipRowLayout", () => {
  it("строки разных индексов не накладываются", () => {
    const rows = [0, 1, 2, 3].map(index =>
      tooltipRowLayout(10, 20, index, metrics),
    );

    for (let index = 1; index < rows.length; index++) {
      expect(rows[index].dotY - rows[index - 1].dotY).toBe(metrics.rowHeight);
    }
  });

  it("позиция внутри плашки", () => {
    expect(tooltipRowLayout(10, 20, 0, metrics)).toEqual({
      dotX: 20,
      dotY: 32,
      textX: 30,
      textY: 35.6,
    });
  });

  it("объявлен как worklet", () => {
    expect(tooltipRowLayout.toString()).toMatch(/["']worklet["']/);
  });
});
