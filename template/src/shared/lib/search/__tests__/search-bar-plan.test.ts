import { planSearchBarOpen, shouldShowBarOnClose } from "../search-bar-plan";

describe("planSearchBarOpen", () => {
  it("шапка видна — спрятать, контент на весь ход", () => {
    expect(planSearchBarOpen(0, 56)).toEqual({ hide: true, shift: 56 });
  });

  it("шапка частично скрыта — на остаток хода", () => {
    expect(planSearchBarOpen(20, 56)).toEqual({ hide: true, shift: 36 });
  });

  it("шапка скрыта — ничего не двигать", () => {
    expect(planSearchBarOpen(56, 56)).toEqual({ hide: false, shift: 0 });
  });
});

describe("shouldShowBarOnClose", () => {
  it("previous — только если поиск её прятал", () => {
    expect(shouldShowBarOnClose("previous", { hide: true, shift: 56 })).toBe(
      true,
    );
    expect(shouldShowBarOnClose("previous", { hide: false, shift: 0 })).toBe(
      false,
    );
  });

  it("show — всегда", () => {
    expect(shouldShowBarOnClose("show", { hide: false, shift: 0 })).toBe(true);
  });

  it("объявлены как worklet", () => {
    expect(planSearchBarOpen.toString()).toMatch(/["']worklet["']/);
    expect(shouldShowBarOnClose.toString()).toMatch(/["']worklet["']/);
  });
});
