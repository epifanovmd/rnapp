import { mapOverlayBoxes, mapRectToView } from "../geometry";
import { IScanOverlayBox } from "../types";

// Портретное превью с cover-обрезкой ландшафтного кадра 1280×720
const image = { width: 1280, height: 720 };
const view = { width: 390, height: 844 };
// cover: масштаб по большей стороне
const scale = Math.max(view.width / image.width, view.height / image.height);

describe("mapRectToView", () => {
  it("маппит полный кадр с центрированием обрезанных краёв", () => {
    const mapped = mapRectToView(
      { x: 0, y: 0, width: 1, height: 1 },
      image.width,
      image.height,
      view,
    );

    expect(mapped.width).toBeCloseTo(image.width * scale, 5);
    expect(mapped.height).toBeCloseTo(view.height, 5);
    expect(mapped.x).toBeCloseTo((view.width - image.width * scale) / 2, 5);
    expect(mapped.y).toBeCloseTo(0, 5);
  });

  it("сохраняет центр кадра в центре вью", () => {
    const mapped = mapRectToView(
      { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
      image.width,
      image.height,
      view,
    );

    expect(mapped.x + mapped.width / 2).toBeCloseTo(view.width / 2, 5);
    expect(mapped.y + mapped.height / 2).toBeCloseTo(view.height / 2, 5);
  });

  it("возвращает нулевой rect при вырожденных размерах", () => {
    const zero = { x: 0, y: 0, width: 0, height: 0 };
    const rect = { x: 0.1, y: 0.1, width: 0.5, height: 0.5 };

    expect(mapRectToView(rect, 0, 720, view)).toEqual(zero);
    expect(mapRectToView(rect, 1280, 720, { width: 0, height: 0 })).toEqual(
      zero,
    );
  });
});

describe("mapOverlayBoxes", () => {
  it("маппит боксы и отбрасывает вырожденные", () => {
    const boxes: IScanOverlayBox[] = [
      { rect: { x: 0.1, y: 0.1, width: 0.2, height: 0.1 }, kind: "text" },
      { rect: { x: 0.5, y: 0.5, width: 0, height: 0 }, kind: "region" },
    ];

    const mapped = mapOverlayBoxes(boxes, image.width, image.height, view);

    expect(mapped).toHaveLength(1);
    expect(mapped[0].kind).toBe("text");
    expect(mapped[0].rect.width).toBeCloseTo(0.2 * image.width * scale, 5);
  });
});
