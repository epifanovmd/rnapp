import { FULL_FRAME_REGION_CLASS } from "../defaults";
import { selectByRegionClass } from "../observations";
import { IOcrScanObservation } from "../types";

function observation(
  text: string,
  regionClassIndex: number,
): IOcrScanObservation {
  return {
    text,
    confidence: 0.9,
    rect: { x: 0, y: 0, width: 0.1, height: 0.1 },
    fromDetector: regionClassIndex !== FULL_FRAME_REGION_CLASS,
    regionClassIndex,
  };
}

describe("selectByRegionClass", () => {
  it("оставляет только области запрошенного класса", () => {
    const observations = [
      observation("MSKU9070323", 0),
      observation("45G1", 1),
      observation("TARE 3700 KG", 2),
    ];

    expect(selectByRegionClass(observations, 1).map(item => item.text)).toEqual(
      ["45G1"],
    );
  });

  it("возвращает пусто, когда класса нет среди размеченных областей", () => {
    const observations = [observation("MSKU9070323", 0)];

    expect(selectByRegionClass(observations, 2)).toEqual([]);
  });

  it("возвращает все области, когда детектор классы не размечал", () => {
    const observations = [
      observation("MSKU9070323", FULL_FRAME_REGION_CLASS),
      observation("45G1", FULL_FRAME_REGION_CLASS),
    ];

    expect(selectByRegionClass(observations, 1)).toEqual(observations);
  });
});
