import {
  resolveInputBarEdgeInset,
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

describe("resolveInputBarEdgeInset", () => {
  const parts = {
    keyboardHeight: 291,
    safeAreaBottom: 34,
    barHeight: 104,
    rowHeight: 56,
  };

  it("с полем в своей колонке край занят только рядом ввода", () => {
    expect(resolveInputBarEdgeInset({ ...parts, fullWidthProgress: 0 })).toBe(
      347,
    );
  });

  it("с полем на всю ширину край занят всей панелью", () => {
    expect(resolveInputBarEdgeInset({ ...parts, fullWidthProgress: 1 })).toBe(
      395,
    );
  });

  it("на ходу микрофона край едет между рядом и панелью", () => {
    expect(resolveInputBarEdgeInset({ ...parts, fullWidthProgress: 0.5 })).toBe(
      371,
    );
  });

  it("без панели ответа обе величины совпадают", () => {
    expect(
      resolveInputBarEdgeInset({
        ...parts,
        barHeight: 56,
        fullWidthProgress: 0,
      }),
    ).toBe(347);
  });

  it("ряд не может занять больше самой панели", () => {
    expect(
      resolveInputBarEdgeInset({
        ...parts,
        barHeight: 40,
        fullWidthProgress: 0,
      }),
    ).toBe(331);
  });

  it("добавка сверх панели входит в обе величины", () => {
    expect(
      resolveInputBarEdgeInset({
        ...parts,
        extraPadding: 8,
        fullWidthProgress: 0,
      }),
    ).toBe(355);
  });
});
