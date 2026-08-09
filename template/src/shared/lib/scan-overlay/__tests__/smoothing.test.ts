import { smoothBoxes } from "../smoothing";
import { IScanOverlayBox } from "../types";

function box(
  x: number,
  kind: IScanOverlayBox["kind"] = "text",
): IScanOverlayBox {
  return { rect: { x, y: 0.2, width: 0.3, height: 0.2 }, kind };
}

describe("smoothBoxes", () => {
  it("новые рамки появляются сразу на месте цели", () => {
    const target = box(0.4);
    const result = smoothBoxes([], [target]);

    expect(result.boxes).toEqual([target]);
    expect(result.settled).toBe(false);
  });

  it("совпадающие рамки считаются сошедшимися", () => {
    const target = box(0.4);
    const result = smoothBoxes([target], [target]);

    expect(result.boxes).toEqual([target]);
    expect(result.settled).toBe(true);
  });

  it("рамка движется к цели и сходится за конечное число кадров", () => {
    const target = box(0.5);
    let displayed = [box(0.3)];
    const first = smoothBoxes(displayed, [target]);

    // первый шаг — частичное продвижение, не телепорт
    expect(first.boxes[0].rect.x).toBeGreaterThan(0.3);
    expect(first.boxes[0].rect.x).toBeLessThan(0.5);
    expect(first.settled).toBe(false);

    displayed = first.boxes;
    for (let i = 0; i < 60; i++) {
      const step = smoothBoxes(displayed, [target]);

      displayed = step.boxes;
      if (step.settled) {
        break;
      }
    }
    expect(displayed[0].rect.x).toBeCloseTo(0.5, 5);
  });

  it("не сопоставляет рамки разных категорий", () => {
    const target = box(0.31, "region");
    const result = smoothBoxes([box(0.3, "text")], [target]);

    // категория не совпала — цель появляется без интерполяции
    expect(result.boxes).toEqual([target]);
  });

  it("далёкая цель не крадёт чужую рамку", () => {
    const target = box(0.95);
    const result = smoothBoxes([box(0.05)], [target]);

    expect(result.boxes).toEqual([target]);
  });
});
