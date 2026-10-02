import { resolveReleaseTarget } from "../bar-visibility";

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
