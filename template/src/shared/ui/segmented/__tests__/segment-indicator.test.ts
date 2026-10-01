import {
  buildIndicatorRanges,
  centerScrollX,
  isLayoutComplete,
  mergeSegmentLayout,
  segmentOpacityRange,
} from "../segment-indicator";

describe("segment-indicator", () => {
  describe("mergeSegmentLayout — замеры сегментов из onLayout", () => {
    it("кладёт замер по индексу, остальные — незамеренные", () => {
      expect(mergeSegmentLayout([], 3, 1, { x: 40, width: 60 })).toEqual([
        { x: 0, width: 0 },
        { x: 40, width: 60 },
        { x: 0, width: 0 },
      ]);
    });

    it("обрезает лишние замеры при уменьшении числа сегментов", () => {
      const prev = [
        { x: 0, width: 10 },
        { x: 10, width: 10 },
        { x: 20, width: 10 },
      ];

      expect(mergeSegmentLayout(prev, 2, 0, { x: 0, width: 12 })).toEqual([
        { x: 0, width: 12 },
        { x: 10, width: 10 },
      ]);
    });
  });

  describe("isLayoutComplete — индикатор строится по полному набору замеров", () => {
    it("все сегменты замерены", () => {
      expect(
        isLayoutComplete(
          [
            { x: 0, width: 10 },
            { x: 12, width: 20 },
          ],
          2,
        ),
      ).toBe(true);
    });

    it("не хватает замера или ширина нулевая", () => {
      expect(isLayoutComplete([{ x: 0, width: 10 }], 2)).toBe(false);
      expect(
        isLayoutComplete(
          [
            { x: 0, width: 10 },
            { x: 12, width: 0 },
          ],
          2,
        ),
      ).toBe(false);
      expect(isLayoutComplete([], 0)).toBe(false);
    });
  });

  describe("buildIndicatorRanges — подложка из трёх слоёв на нативном драйвере", () => {
    const layouts = [
      { x: 3, width: 60 },
      { x: 65, width: 100 },
    ];

    it("inputRange — индексы вкладок", () => {
      expect(buildIndicatorRanges(layouts, 9).inputRange).toEqual([0, 1]);
    });

    it("левая шапка — у левого края сегмента, правая — у правого", () => {
      const ranges = buildIndicatorRanges(layouts, 9);

      expect(ranges.startCapX).toEqual([3, 65]);
      expect(ranges.endCapX).toEqual([3 + 60 - 9, 65 + 100 - 9]);
    });

    it("тело перекрывает шапки на 1px и растягивается scaleX от ширины 1", () => {
      const ranges = buildIndicatorRanges(layouts, 9);

      // левый край тела: x + cap - 1; transform-origin — центр 1px-вью
      expect(ranges.bodyX).toEqual([3 + 9 - 1 - 0.5, 65 + 9 - 1 - 0.5]);
      expect(ranges.bodyScale).toEqual([60 - 18 + 2, 100 - 18 + 2]);
    });

    it("тело не схлопывается в 0 у узкого сегмента", () => {
      const ranges = buildIndicatorRanges([{ x: 0, width: 10 }], 9);

      expect(ranges.bodyScale.every(scale => scale >= 1)).toBe(true);
    });

    it("одна вкладка — диапазон из двух одинаковых точек (interpolate требует ≥ 2)", () => {
      const ranges = buildIndicatorRanges([{ x: 3, width: 60 }], 9);

      expect(ranges.inputRange).toEqual([0, 1]);
      expect(ranges.startCapX).toEqual([3, 3]);
    });
  });

  describe("segmentOpacityRange — перекрёстное затухание подписей", () => {
    it("активный слой виден только на своём индексе", () => {
      expect(segmentOpacityRange(3, 1, true)).toEqual({
        inputRange: [0, 1, 2],
        outputRange: [0, 1, 0],
      });
    });

    it("неактивный слой — наоборот", () => {
      expect(segmentOpacityRange(3, 1, false)).toEqual({
        inputRange: [0, 1, 2],
        outputRange: [1, 0, 1],
      });
    });

    it("одна вкладка — всегда активна", () => {
      expect(segmentOpacityRange(1, 0, true).outputRange).toEqual([1, 1]);
      expect(segmentOpacityRange(1, 0, false).outputRange).toEqual([0, 0]);
    });
  });

  describe("centerScrollX — автоцентрирование активного сегмента", () => {
    it("центр сегмента — в центр контейнера", () => {
      expect(centerScrollX({ x: 300, width: 100 }, 200)).toBe(250);
    });

    it("не уходит левее начала", () => {
      expect(centerScrollX({ x: 10, width: 40 }, 300)).toBe(0);
    });
  });
});
