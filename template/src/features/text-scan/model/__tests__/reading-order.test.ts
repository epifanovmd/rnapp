import { IOcrScanObservation } from "@shared/lib/ocr-scan";

import { toReadingOrder } from "../reading-order";

const observation = (
  text: string,
  x: number,
  y: number,
): IOcrScanObservation => ({
  text,
  confidence: 0.9,
  rect: { x, y, width: 0.1, height: 0.01 },
});

/** Все перестановки массива */
const permutations = <T>(items: T[]): T[][] =>
  items.length <= 1
    ? [items]
    : items.flatMap((item, index) =>
        permutations([...items.slice(0, index), ...items.slice(index + 1)]).map(
          rest => [item, ...rest],
        ),
      );

describe("toReadingOrder", () => {
  it("читает сверху вниз, в строке — слева направо", () => {
    expect(
      toReadingOrder([
        observation("низ", 0.1, 0.5),
        observation("право", 0.6, 0.1),
        observation("лево", 0.1, 0.105),
      ]),
    ).toEqual(["лево", "право", "низ"]);
  });

  it("порядок не зависит от порядка областей на входе", () => {
    // соседние по высоте области: попарно «в одной строке», но крайние — нет
    const items = [
      observation("a", 0.5, 0),
      observation("b", 0.1, 0.015),
      observation("c", 0, 0.03),
    ];
    const orders = permutations(items).map(order =>
      toReadingOrder(order).join(""),
    );

    expect(new Set(orders).size).toBe(1);
  });
});
