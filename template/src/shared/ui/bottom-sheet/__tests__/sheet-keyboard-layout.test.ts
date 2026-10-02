import {
  computeSheetKeyboardLayout,
  isSheetClosing,
  SHEET_KEYBOARD_GAP,
} from "../sheet-keyboard-layout";

const GAP = SHEET_KEYBOARD_GAP;

describe("computeSheetKeyboardLayout", () => {
  it("клавиатура закрыта — без сдвига, отступ под home indicator", () => {
    expect(
      computeSheetKeyboardLayout({
        keyboardHeight: 0,
        restPosition: 300,
        safeAreaBottom: 34,
      }),
    ).toEqual({ translateY: 0, paddingBottom: 34 });
  });

  it("невысокая шторка поднимается целиком, футер в 12 над клавиатурой", () => {
    // Подъём = клавиатура + зазор − safe area: низ контента с отступом 34
    // встаёт так, что футер на 12 выше клавиатуры.
    expect(
      computeSheetKeyboardLayout({
        keyboardHeight: 336,
        restPosition: 500,
        safeAreaBottom: 34,
      }),
    ).toEqual({ translateY: -(336 + GAP - 34), paddingBottom: 34 });
  });

  it("шторка на всю высоту не двигается, отступ растёт до клавиатуры + 12", () => {
    expect(
      computeSheetKeyboardLayout({
        keyboardHeight: 336,
        restPosition: 0,
        safeAreaBottom: 34,
      }),
    ).toEqual({ translateY: 0, paddingBottom: 336 + GAP });
  });

  it("промежуточная: подъём до верха, остаток — отступом", () => {
    expect(
      computeSheetKeyboardLayout({
        keyboardHeight: 336,
        restPosition: 100,
        safeAreaBottom: 34,
      }),
    ).toEqual({ translateY: -100, paddingBottom: 34 + (336 + GAP - 34 - 100) });
  });

  it("Android без safe area: тот же зазор 12", () => {
    expect(
      computeSheetKeyboardLayout({
        keyboardHeight: 300,
        restPosition: 0,
        safeAreaBottom: 0,
      }),
    ).toEqual({ translateY: 0, paddingBottom: 300 + GAP });
  });

  it("начало анимации: без скачка, зазор набирается первыми 12 px", () => {
    const first = computeSheetKeyboardLayout({
      keyboardHeight: 4,
      restPosition: 0,
      safeAreaBottom: 0,
    });

    expect(first.paddingBottom).toBe(8);
    expect(
      computeSheetKeyboardLayout({
        keyboardHeight: 10,
        restPosition: 500,
        safeAreaBottom: 34,
      }).translateY,
    ).toBe(0);
  });
});

describe("isSheetClosing", () => {
  it("закрытие — переход на индекс −1 из открытого состояния", () => {
    expect(isSheetClosing(0, -1)).toBe(true);
    expect(isSheetClosing(1, -1)).toBe(true);
  });

  it("открытие и переходы между точками — не закрытие", () => {
    expect(isSheetClosing(-1, 0)).toBe(false);
    expect(isSheetClosing(0, 1)).toBe(false);
    expect(isSheetClosing(-1, -1)).toBe(false);
  });
});
