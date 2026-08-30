import {
  resolveInputBarInset,
  resolveInputBarOffset,
} from "../input-bar-inset";

describe("resolveInputBarOffset", () => {
  it("без клавиатуры перекрывает ровно безопасную зону", () => {
    expect(
      resolveInputBarOffset({ keyboardHeight: 0, safeAreaBottom: 34 }),
    ).toBe(34);
  });

  it("открытая клавиатура закрывает зону собой, а не поверх неё", () => {
    expect(
      resolveInputBarOffset({ keyboardHeight: 291, safeAreaBottom: 34 }),
    ).toBe(291);
  });

  it("на ходу клавиатуры зона держит нижнюю границу", () => {
    expect(
      resolveInputBarOffset({ keyboardHeight: 12, safeAreaBottom: 34 }),
    ).toBe(34);
  });
});

describe("resolveInputBarInset", () => {
  it("добавляет к перекрытию высоту панели", () => {
    expect(
      resolveInputBarInset({
        keyboardHeight: 0,
        safeAreaBottom: 34,
        barHeight: 56,
      }),
    ).toBe(90);
  });

  it("учитывает добавку сверх панели и зоны", () => {
    expect(
      resolveInputBarInset({
        keyboardHeight: 0,
        safeAreaBottom: 34,
        barHeight: 56,
        extraPadding: 8,
      }),
    ).toBe(98);
  });

  it("с открытой клавиатурой считает от неё, а не от зоны", () => {
    expect(
      resolveInputBarInset({
        keyboardHeight: 291,
        safeAreaBottom: 34,
        barHeight: 56,
      }),
    ).toBe(347);
  });
});
