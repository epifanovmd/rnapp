import {
  clampOffset,
  isRemeasure,
  rebaseOffset,
  resolveCollapseRange,
  resolveFollowDelta,
  snapOffset,
} from "../bar-visibility";

describe("bar-visibility", () => {
  describe("resolveCollapseRange — ход скрытия панели", () => {
    it("без закреплённой части — вся высота панели", () => {
      expect(resolveCollapseRange(200, 0)).toBe(200);
    });

    it("закреплённая часть не прячется", () => {
      // HiddenBar 250 px, из них 50 — закреплённые табы.
      expect(resolveCollapseRange(250, 50)).toBe(200);
    });

    it("не больше высоты и не меньше нуля", () => {
      expect(resolveCollapseRange(100, -20)).toBe(100);
      expect(resolveCollapseRange(100, 300)).toBe(0);
    });
  });

  describe("ход шапки в пределах хода скрытия", () => {
    it("смещение упирается в ход, а не в полную высоту — без мёртвой зоны", () => {
      const range = resolveCollapseRange(250, 50);

      expect(clampOffset(230, range)).toBe(200);
    });

    it("доводка — по половине хода скрытия", () => {
      const range = resolveCollapseRange(250, 50);

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

  describe("rebaseOffset — смена хода скрытия при живой высоте шапки", () => {
    it("скрытая шапка остаётся скрытой, когда скрываемая часть выросла", () => {
      // была скрыта на 200, в карточке появился баннер +40
      expect(rebaseOffset(200, 200, 240)).toBe(240);
    });

    it("скрытая шапка остаётся скрытой, когда скрываемая часть уменьшилась", () => {
      expect(rebaseOffset(200, 200, 160)).toBe(160);
    });

    it("показанная шапка остаётся показанной", () => {
      expect(rebaseOffset(0, 200, 240)).toBe(0);
      expect(rebaseOffset(0, 200, 160)).toBe(0);
    });

    it("частично скрытая — то же смещение в пределах нового хода", () => {
      expect(rebaseOffset(80, 200, 240)).toBe(80);
      expect(rebaseOffset(180, 200, 160)).toBe(160);
    });

    it("до первого измерения хода нет — шапка показана", () => {
      expect(rebaseOffset(0, 0, 240)).toBe(0);
    });

    it("через промежуточные измерения скрытость сохраняется", () => {
      // высота и закреплённая часть приходят разными onLayout
      const afterHeight = rebaseOffset(200, 200, 260);
      const afterPinned = rebaseOffset(afterHeight, 260, 220);

      expect(afterPinned).toBe(220);
    });
  });

  describe("isRemeasure — анимировать ли отступ контента", () => {
    it("первое измерение — сразу, без анимации от нуля", () => {
      expect(isRemeasure(0, 120)).toBe(false);
    });

    it("смена измеренной высоты — анимация", () => {
      expect(isRemeasure(120, 160)).toBe(true);
    });

    it("панель исчезла — сразу", () => {
      expect(isRemeasure(120, 0)).toBe(false);
    });
  });
});
