import {
  resolveSheetBottomPadding,
  resolveSheetKeyboardInset,
  SHEET_KEYBOARD_GAP,
} from "../sheet-keyboard-layout";

describe("resolveSheetBottomPadding", () => {
  it("клавиатура закрыта — отступ под home indicator", () => {
    expect(resolveSheetBottomPadding(34, 0)).toBe(34);
  });

  it("клавиатура открыта — обычный зазор без safe area", () => {
    expect(resolveSheetBottomPadding(34, 1)).toBe(SHEET_KEYBOARD_GAP);
  });

  it("покадрово между ними по прогрессу клавиатуры", () => {
    expect(resolveSheetBottomPadding(34, 0.5)).toBe(
      34 + (SHEET_KEYBOARD_GAP - 34) * 0.5,
    );
  });

  it("прогресс за пределами зажимается", () => {
    expect(resolveSheetBottomPadding(34, 1.4)).toBe(SHEET_KEYBOARD_GAP);
    expect(resolveSheetBottomPadding(34, -0.2)).toBe(34);
  });
});

describe("resolveSheetKeyboardInset", () => {
  it("с футером: футер, зазор до него и нижний отступ при клавиатуре", () => {
    expect(
      resolveSheetKeyboardInset({ hasFooter: true, footerHeight: 44, gap: 16 }),
    ).toBe(44 + 16 + SHEET_KEYBOARD_GAP);
  });

  it("без футера — только нижний отступ", () => {
    expect(
      resolveSheetKeyboardInset({
        hasFooter: false,
        footerHeight: 44,
        gap: 16,
      }),
    ).toBe(SHEET_KEYBOARD_GAP);
  });
});
