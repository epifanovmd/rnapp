import {
  planSearchBarOpen,
  resolveSearchGapShift,
  shouldShowBarOnClose,
} from "../search-bar-plan";

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

  it("previous — показать, если шапка скрыта больше прокрутки контента", () => {
    expect(
      shouldShowBarOnClose("previous", { hide: false, shift: 0 }, 56, 10),
    ).toBe(true);
    expect(
      shouldShowBarOnClose("previous", { hide: false, shift: 0 }, 56, 300),
    ).toBe(false);
  });

  it("объявлены как worklet", () => {
    expect(planSearchBarOpen.toString()).toMatch(/["']worklet["']/);
    expect(shouldShowBarOnClose.toString()).toMatch(/["']worklet["']/);
    expect(resolveSearchGapShift.toString()).toMatch(/["']worklet["']/);
  });
});

describe("resolveSearchGapShift", () => {
  it("шапка скрыта, контент прокручен дальше — сдвиг не меняется", () => {
    expect(resolveSearchGapShift(0, 56, 500, 2000)).toBe(0);
  });

  it("фильтр укоротил список, скролл у начала — контент поднимается на скрытую часть", () => {
    expect(resolveSearchGapShift(0, 56, 0, 0)).toBe(56);
    expect(resolveSearchGapShift(0, 56, 20, 2000)).toBe(36);
  });

  it("скролл ещё не обновился — прокрутка ограничена новым максимумом", () => {
    expect(resolveSearchGapShift(0, 56, 500, 0)).toBe(56);
  });

  it("сдвиг не уменьшается — контент не дёргается обратно", () => {
    expect(resolveSearchGapShift(56, 56, 300, 2000)).toBe(56);
  });
});
