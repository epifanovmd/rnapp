import {
  isProgrammaticScrollSettled,
  isScrollAtOffset,
  resolveScrollEdges,
} from "../list-scroll";

describe("isProgrammaticScrollSettled", () => {
  it("без цели программного скролла завершать нечего", () => {
    expect(isProgrammaticScrollSettled(null, "2026-04")).toBe(false);
  });

  it("viewability показала цель — скролл завершён", () => {
    expect(isProgrammaticScrollSettled("2026-05", "2026-05")).toBe(true);
  });

  it("промежуточный месяц или отсутствие событий — ещё едем", () => {
    // Конец прерванной первой анимации приходит раньше любой viewability: пустой pending — не финиш.
    expect(isProgrammaticScrollSettled("2026-05", null)).toBe(false);
    expect(isProgrammaticScrollSettled("2026-05", "2026-04")).toBe(false);
  });
});

describe("isScrollAtOffset", () => {
  it("совпадение с расчётным offset цели с точностью до пикселя", () => {
    expect(isScrollAtOffset(9188, 9188, null)).toBe(true);
    expect(isScrollAtOffset(9188.4, 9188, null)).toBe(true);
    expect(isScrollAtOffset(8635, 9188, null)).toBe(false);
  });

  it("у конца списка цель прижимается к максимальному offset", () => {
    expect(isScrollAtOffset(10000, 10548, 10000)).toBe(true);
    expect(isScrollAtOffset(9500, 10548, 10000)).toBe(false);
  });
});

describe("resolveScrollEdges", () => {
  it("в начале, в середине и в конце списка", () => {
    expect(resolveScrollEdges(0, 5000)).toEqual({
      atStart: true,
      atEnd: false,
    });
    expect(resolveScrollEdges(2000, 5000)).toEqual({
      atStart: false,
      atEnd: false,
    });
    expect(resolveScrollEdges(5000, 5000)).toEqual({
      atStart: false,
      atEnd: true,
    });
    expect(resolveScrollEdges(4999.5, 5000)).toEqual({
      atStart: false,
      atEnd: true,
    });
  });

  it("контент короче вьюпорта — упёрлись в оба края", () => {
    expect(resolveScrollEdges(0, -100)).toEqual({ atStart: true, atEnd: true });
  });

  it("границы контента ещё неизвестны — считаем только начало", () => {
    expect(resolveScrollEdges(0, null)).toEqual({
      atStart: true,
      atEnd: false,
    });
    expect(resolveScrollEdges(300, null)).toEqual({
      atStart: false,
      atEnd: false,
    });
  });
});
