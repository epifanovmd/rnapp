import {
  interpolatePageHeight,
  resistPage,
  resolveSlideRange,
  resolveSwipeTarget,
  SWIPE_RESISTANCE,
} from "../month-slide";

describe("resolveSlideRange", () => {
  it("свайп ограничен соседями текущего месяца", () => {
    expect(resolveSlideRange(5, true, true)).toEqual({
      current: 5,
      min: 4,
      max: 6,
    });
  });

  it("закрытое направление не даёт уйти с текущей страницы", () => {
    expect(resolveSlideRange(0, false, true)).toEqual({
      current: 0,
      min: 0,
      max: 1,
    });
    expect(resolveSlideRange(0, true, false)).toEqual({
      current: 0,
      min: -1,
      max: 0,
    });
  });
});

describe("resistPage", () => {
  const range = resolveSlideRange(0, false, true);

  it("внутри диапазона палец двигает страницу один в один", () => {
    expect(resistPage(0.4, range)).toBe(0.4);
    expect(resistPage(1, range)).toBe(1);
  });

  it("за границей страница идёт за пальцем с сопротивлением", () => {
    expect(resistPage(-0.5, range)).toBeCloseTo(-0.5 * SWIPE_RESISTANCE);
    expect(resistPage(1.5, range)).toBeCloseTo(1 + 0.5 * SWIPE_RESISTANCE);
  });
});

describe("resolveSwipeTarget", () => {
  const open = resolveSlideRange(0, true, true);

  it("медленный свайп: цель — ближайшая страница", () => {
    expect(resolveSwipeTarget(0.4, 0, open)).toBe(0);
    expect(resolveSwipeTarget(0.6, 0, open)).toBe(1);
    expect(resolveSwipeTarget(-0.6, 0, open)).toBe(-1);
  });

  it("быстрый короткий жест засчитывается за счёт скорости", () => {
    // Скорость в страницах/с: отрицательная — палец влево, к следующему месяцу.
    expect(resolveSwipeTarget(0.15, -3, open)).toBe(1);
    expect(resolveSwipeTarget(-0.15, 3, open)).toBe(-1);
  });

  it("один свайп не уходит дальше соседа даже при большой скорости", () => {
    expect(resolveSwipeTarget(0.9, -50, open)).toBe(1);
    expect(resolveSwipeTarget(-0.9, 50, open)).toBe(-1);
  });

  it("в закрытом направлении цель — текущая страница", () => {
    expect(resolveSwipeTarget(0.9, -5, resolveSlideRange(0, true, false))).toBe(
      0,
    );
    expect(resolveSwipeTarget(-0.9, 5, resolveSlideRange(0, false, true))).toBe(
      0,
    );
  });

  it("жест, подхвативший страницу посреди анимации, продолжает её к ближайшей", () => {
    // Месяц уже сменился на 1, страница ещё едет: 0.7 → отпустили без движения.
    expect(resolveSwipeTarget(0.7, 0, resolveSlideRange(1, true, true))).toBe(
      1,
    );
    // Немного протянули назад — возвращаемся к 0.
    expect(resolveSwipeTarget(0.45, 0, resolveSlideRange(1, true, true))).toBe(
      0,
    );
  });

  it("серия быстрых свайпов: каждое отпускание фиксирует месяц, ничего не теряется", () => {
    // Три вперёд и один назад, каждый следующий начинается посреди анимации.
    let current = 0;
    const swipes: [number, number][] = [
      [0.4, -2],
      [1.3, -2],
      [2.2, -2],
      [2.7, 2],
    ];

    for (const [page, velocity] of swipes) {
      current = resolveSwipeTarget(
        page,
        velocity,
        resolveSlideRange(current, true, true),
      );
    }

    expect(current).toBe(2);
  });
});

describe("interpolatePageHeight", () => {
  const stops = [
    { index: -1, height: 300 },
    { index: 0, height: 250 },
    { index: 1, height: 350 },
  ];

  it("на целой странице — её высота", () => {
    expect(interpolatePageHeight(0, stops)).toBe(250);
    expect(interpolatePageHeight(1, stops)).toBe(350);
  });

  it("между страницами — линейно", () => {
    expect(interpolatePageHeight(0.5, stops)).toBe(300);
    expect(interpolatePageHeight(-0.5, stops)).toBe(275);
  });

  it("за крайними страницами высота не растёт", () => {
    expect(interpolatePageHeight(3, stops)).toBe(350);
    expect(interpolatePageHeight(-3, stops)).toBe(300);
  });

  it("одна страница — её высота при любой позиции", () => {
    expect(interpolatePageHeight(0.7, [{ index: 0, height: 250 }])).toBe(250);
  });

  it("без страниц — 0", () => {
    expect(interpolatePageHeight(0, [])).toBe(0);
  });
});
