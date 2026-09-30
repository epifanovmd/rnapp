import type { CameraOrientation } from "react-native-vision-camera";

import {
  previewOrientationDelta,
  swapsFrameSides,
  toPreviewRect,
} from "../orientation";
import { IOcrScanRect } from "../types";

const rect: IOcrScanRect = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };

describe("previewOrientationDelta", () => {
  it.each<[CameraOrientation, CameraOrientation, CameraOrientation]>([
    ["up", "up", "up"],
    ["right", "up", "right"],
    ["left", "up", "left"],
    ["down", "up", "down"],
    // интерфейс повёрнут вместе с телефоном — доворота нет
    ["right", "right", "up"],
    ["left", "left", "up"],
    ["up", "right", "left"],
    ["up", "left", "right"],
  ])(
    "устройство %s при интерфейсе %s даёт доворот %s",
    (device, interfaceOrientation, expected) => {
      expect(previewOrientationDelta(device, interfaceOrientation)).toBe(
        expected,
      );
    },
  );
});

describe("toPreviewRect", () => {
  it("оставляет координаты кадра как есть без доворота", () => {
    expect(toPreviewRect(rect, "up")).toEqual(rect);
  });

  it("доворачивает противоположные ориентации обратно к исходной", () => {
    const rotated = toPreviewRect(rect, "right");
    const restored = toPreviewRect(rotated, "left");

    expect(restored.x).toBeCloseTo(rect.x, 10);
    expect(restored.y).toBeCloseTo(rect.y, 10);
    expect(restored.width).toBeCloseTo(rect.width, 10);
    expect(restored.height).toBeCloseTo(rect.height, 10);
  });

  it("телефон повёрнут вправо — верх кадра уходит влево на превью", () => {
    // узкая полоса у верхней кромки выпрямленного кадра
    const topStrip: IOcrScanRect = { x: 0.2, y: 0, width: 0.6, height: 0.1 };
    const preview = toPreviewRect(topStrip, "right");

    expect(preview.x).toBeCloseTo(0, 10);
    expect(preview.width).toBeCloseTo(0.1, 10);
    expect(preview.y).toBeCloseTo(0.2, 10);
    expect(preview.height).toBeCloseTo(0.6, 10);
  });

  it("телефон повёрнут влево — верх кадра уходит вправо на превью", () => {
    const topStrip: IOcrScanRect = { x: 0.2, y: 0, width: 0.6, height: 0.1 };
    const preview = toPreviewRect(topStrip, "left");

    expect(preview.x).toBeCloseTo(0.9, 10);
    expect(preview.width).toBeCloseTo(0.1, 10);
    expect(preview.y).toBeCloseTo(0.2, 10);
    expect(preview.height).toBeCloseTo(0.6, 10);
  });
});

describe("swapsFrameSides", () => {
  it.each<[CameraOrientation, boolean]>([
    ["up", false],
    ["down", false],
    ["left", true],
    ["right", true],
  ])("для %s возвращает %s", (orientation, expected) => {
    expect(swapsFrameSides(orientation)).toBe(expected);
  });
});
