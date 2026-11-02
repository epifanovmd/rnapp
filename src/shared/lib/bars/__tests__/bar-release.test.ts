import { resolveFollowShift, resolveReleaseTarget } from "../bar-visibility";

describe("resolveReleaseTarget", () => {
  it("по направлению: вниз — спрятать, вверх — показать", () => {
    expect(resolveReleaseTarget(10, 100, "down")).toBe("hide");
    expect(resolveReleaseTarget(90, 100, "up")).toBe("show");
  });

  it("без направления — к ближайшему состоянию", () => {
    expect(resolveReleaseTarget(60, 100, null)).toBe("hide");
    expect(resolveReleaseTarget(40, 100, null)).toBe("show");
  });

  it("панель без хода остаётся показанной", () => {
    expect(resolveReleaseTarget(0, 0, "down")).toBe("show");
  });
});

describe("resolveReleaseTarget: контент прокручен меньше хода скрытия", () => {
  it("вниз — шапка не прячется целиком, а следует за контентом", () => {
    expect(resolveReleaseTarget(50, 400, "down", 50)).toBe("follow");
  });

  it("без направления — остаётся, где стоит", () => {
    expect(resolveReleaseTarget(300, 400, null, 300)).toBe("follow");
  });

  it("вверх — не выезжает, а тоже следует за контентом", () => {
    expect(resolveReleaseTarget(50, 400, "up", 50)).toBe("follow");
  });

  it("за порогом вверх — показать", () => {
    expect(resolveReleaseTarget(400, 400, "up", 800)).toBe("show");
  });

  it("прокручен на весь ход — прячется как обычно", () => {
    expect(resolveReleaseTarget(50, 400, "down", 400)).toBe("hide");
  });
});

describe("resolveFollowShift", () => {
  it("1:1, пока шапка уехала не дальше прокрутки", () => {
    expect(resolveFollowShift(0, 30, 200)).toBe(30);
    expect(resolveFollowShift(100, -20, 80)).toBe(-20);
  });

  it("шапка не уезжает дальше прокрутки контента", () => {
    expect(resolveFollowShift(40, 30, 50)).toBe(10);
  });

  it("прокрутка ушла назад ниже смещения — шапка возвращается к ней", () => {
    expect(resolveFollowShift(300, -10, 120)).toBe(-180);
  });

  it("отрицательная прокрутка (оверскролл) — как 0", () => {
    expect(resolveFollowShift(20, -5, -30)).toBe(-20);
  });
});
