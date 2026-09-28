import { splitAnimatedStyle } from "../split-animated-style";

describe("splitAnimatedStyle", () => {
  it("вынимает opacity и transform, остальное оставляет", () => {
    expect(
      splitAnimatedStyle({
        opacity: 0.4,
        transform: [{ rotate: "45deg" }, { translateX: 8 }],
        width: 10,
      }),
    ).toEqual({
      baseOpacity: 0.4,
      baseTransform: [{ rotate: "45deg" }, { translateX: 8 }],
      style: { width: 10 },
    });
  });

  it("без opacity и transform — базовые 1 и пустой список", () => {
    expect(splitAnimatedStyle({ width: 10 })).toEqual({
      baseOpacity: 1,
      baseTransform: [],
      style: { width: 10 },
    });
  });

  it("строковое opacity приводится к числу, мусор — к 1", () => {
    expect(splitAnimatedStyle({ opacity: "0.5" as never }).baseOpacity).toBe(
      0.5,
    );
    expect(splitAnimatedStyle({ opacity: "abc" as never }).baseOpacity).toBe(1);
  });

  it("transform строкой (CSS-синтаксис) не поддерживается — отбрасывается", () => {
    expect(
      splitAnimatedStyle({ transform: "rotate(45deg)" as never }).baseTransform,
    ).toEqual([]);
  });
});
