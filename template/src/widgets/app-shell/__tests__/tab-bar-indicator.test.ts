import {
  resolveIndicatorInsets,
  resolveWormDelays,
} from "../tab-bar-indicator";

describe("tab-bar-indicator", () => {
  describe("resolveWormDelays — «червяк» при переключении", () => {
    it("вправо: правый край едет сразу, левый догоняет с задержкой", () => {
      expect(resolveWormDelays(0, 2, 150)).toEqual({ left: 150, right: 0 });
    });

    it("влево: левый край сразу, правый с задержкой", () => {
      expect(resolveWormDelays(2, 1, 150)).toEqual({ left: 0, right: 150 });
    });

    it("смена направления считается от фактического прежнего индекса", () => {
      // 1 → 2 → 1: на обратном ходе тянется правый край.
      expect(resolveWormDelays(1, 2, 150)).toEqual({ left: 150, right: 0 });
      expect(resolveWormDelays(2, 1, 150)).toEqual({ left: 0, right: 150 });
    });

    it("тот же индекс — без задержек", () => {
      expect(resolveWormDelays(1, 1, 150)).toEqual({ left: 0, right: 0 });
    });
  });

  it("resolveIndicatorInsets — отступы подложки от краёв панели", () => {
    // 4 вкладки по 56 px, внутренний отступ панели 8.
    expect(resolveIndicatorInsets(0, 4, 56, 8)).toEqual({ left: 8, right: 176 });
    expect(resolveIndicatorInsets(3, 4, 56, 8)).toEqual({ left: 176, right: 8 });
  });
});
