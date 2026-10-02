import {
  planScrollAnimation,
  SCROLL_ANIMATION_DURATION,
  SCROLL_RETARGET_MIN_DURATION,
} from "../scroll-animation";

describe("planScrollAnimation", () => {
  it("покой, цель далеко — старт от текущего положения", () => {
    expect(
      planScrollAnimation({
        animating: false,
        position: 900,
        target: 900,
        nextTarget: 100,
        remaining: 0,
      }),
    ).toEqual({
      action: "start",
      from: 900,
      duration: SCROLL_ANIMATION_DURATION,
    });
  });

  it("покой, цель = положение — ничего (поле видно)", () => {
    expect(
      planScrollAnimation({
        animating: false,
        position: 100,
        target: 100,
        nextTarget: 100.2,
        remaining: 0,
      }).action,
    ).toBe("none");
  });

  it("анимация идёт к той же цели — не перезапускать", () => {
    expect(
      planScrollAnimation({
        animating: true,
        position: 500,
        target: 100,
        nextTarget: 100.3,
        remaining: 120,
      }).action,
    ).toBe("none");
  });

  it("цель сместилась из-за раскладки — перенаправить с текущего места за остаток времени", () => {
    expect(
      planScrollAnimation({
        animating: true,
        position: 500,
        target: 100,
        nextTarget: 140,
        remaining: 120,
      }),
    ).toEqual({ action: "retarget", from: 500, duration: 120 });
  });

  it("почти доехали — остаток не короче минимума, без рывка", () => {
    expect(
      planScrollAnimation({
        animating: true,
        position: 105,
        target: 100,
        nextTarget: 180,
        remaining: 10,
      }),
    ).toEqual({
      action: "retarget",
      from: 105,
      duration: SCROLL_RETARGET_MIN_DURATION,
    });
  });
});
