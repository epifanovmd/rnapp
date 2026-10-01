import {
  clampOffset,
  resolveCollapseRange,
  resolveFollowDelta,
  snapOffset,
} from "../bar-visibility";

describe("bar-visibility", () => {
  describe("resolveCollapseRange — ход скрытия панели", () => {
    it("не задан — вся высота панели", () => {
      expect(resolveCollapseRange(200, null)).toBe(200);
    });

    it("задан — только он: закреплённая часть не прячется", () => {
      // HiddenBar 250 px, из них 50 — закреплённые табы.
      expect(resolveCollapseRange(250, 200)).toBe(200);
    });

    it("не больше высоты и не меньше нуля", () => {
      expect(resolveCollapseRange(100, 300)).toBe(100);
      expect(resolveCollapseRange(100, -20)).toBe(0);
    });
  });

  describe("ход шапки в пределах хода скрытия", () => {
    it("смещение упирается в ход, а не в полную высоту — без мёртвой зоны", () => {
      const range = resolveCollapseRange(250, 200);

      expect(clampOffset(230, range)).toBe(200);
    });

    it("доводка — по половине хода скрытия", () => {
      const range = resolveCollapseRange(250, 200);

      // 110 из 200 пройдено — скрыть (по полной высоте 250 вернулась бы).
      expect(snapOffset(110, range)).toBe(200);
      expect(snapOffset(90, range)).toBe(0);
    });
  });

  describe("resolveFollowDelta — шаг следования за скроллом", () => {
    it("обычный скролл — 1:1, шапка не отстаёт от пальца", () => {
      expect(resolveFollowDelta(24, 200)).toBe(24);
      expect(resolveFollowDelta(-37, 200)).toBe(-37);
    });

    it("разовый скачок смещения (смена вкладки, программный скролл) не двигает шапку", () => {
      expect(resolveFollowDelta(640, 200)).toBe(0);
      expect(resolveFollowDelta(-900, 200)).toBe(0);
    });
  });
});
