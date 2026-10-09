import {
  anchoredRange,
  autoMinSpan,
  clampRange,
  isAtEnd,
  isFullRange,
  lastRange,
  matchSpanPreset,
  panRange,
  pinnedRange,
  reconcileRange,
  resolveViewPin,
  rubberRange,
  ViewLimits,
  zoomRange,
} from "../viewport-math";

const limits: ViewLimits = { min: 0, max: 1000, minSpan: 10 };
const NONE: ViewLimits = { min: NaN, max: NaN, minSpan: 10 };

describe("clampRange", () => {
  it("не уводит окно за пределы данных", () => {
    expect(clampRange({ start: -50, end: 50 }, limits)).toEqual({
      start: 0,
      end: 100,
    });
    expect(clampRange({ start: 950, end: 1050 }, limits)).toEqual({
      start: 900,
      end: 1000,
    });
  });

  it("ширина — от minSpan до всех данных", () => {
    expect(clampRange({ start: 100, end: 101 }, limits)).toEqual({
      start: 100,
      end: 110,
    });
    expect(clampRange({ start: -10, end: 2000 }, limits)).toEqual({
      start: 0,
      end: 1000,
    });
  });
});

describe("zoomRange", () => {
  it("точка зума остаётся на месте", () => {
    const next = zoomRange({ start: 0, end: 100 }, 25, 2);

    expect(next).toEqual({ start: 12.5, end: 62.5 });
    expect((25 - next.start) / (next.end - next.start)).toBeCloseTo(0.25);
  });

  it("factor < 1 отдаляет", () => {
    expect(zoomRange({ start: 40, end: 60 }, 50, 0.5)).toEqual({
      start: 30,
      end: 70,
    });
  });
});

describe("anchoredRange / panRange", () => {
  it("якорь на заданной доле окна", () => {
    expect(anchoredRange(50, 0.5, 20)).toEqual({ start: 40, end: 60 });
  });

  it("сдвиг", () => {
    expect(panRange({ start: 10, end: 20 }, 5)).toEqual({
      start: 15,
      end: 25,
    });
  });
});

describe("rubberRange", () => {
  it("за краем — с сопротивлением, но в ту же сторону", () => {
    const next = rubberRange({ start: -50, end: 50 }, limits);

    expect(next.start).toBeLessThan(0);
    expect(next.start).toBeGreaterThan(-50);
    expect(next.end - next.start).toBe(100);
  });

  it("внутри данных — без изменений", () => {
    expect(rubberRange({ start: 10, end: 110 }, limits)).toEqual({
      start: 10,
      end: 110,
    });
  });
});

describe("isFullRange / isAtEnd / lastRange", () => {
  it("определяет положение окна", () => {
    expect(isFullRange({ start: 0, end: 1000 }, limits)).toBe(true);
    expect(isFullRange({ start: 1, end: 1000 }, limits)).toBe(false);
    expect(isAtEnd({ start: 900, end: 1000 }, limits)).toBe(true);
    expect(isAtEnd({ start: 800, end: 900 }, limits)).toBe(false);
  });

  it("последний отрезок данных", () => {
    expect(lastRange(100, limits)).toEqual({ start: 900, end: 1000 });
    expect(lastRange(0, limits)).toEqual({ start: 0, end: 1000 });
    expect(lastRange(5000, limits)).toEqual({ start: 0, end: 1000 });
  });
});

describe("reconcileRange", () => {
  const unset = { start: NaN, end: NaN };

  it("первые данные — initialSpan у правого края", () => {
    expect(
      reconcileRange({
        range: unset,
        previous: NONE,
        next: limits,
        initialSpan: 100,
      }),
    ).toEqual({ start: 900, end: 1000 });
  });

  it("окно на всех данных остаётся на всех", () => {
    expect(
      reconcileRange({
        range: { start: 0, end: 1000 },
        previous: limits,
        next: { ...limits, min: 10, max: 1010 },
        initialSpan: 0,
      }),
    ).toEqual({ start: 10, end: 1010 });
  });

  it("окно у правого края едет за новыми данными", () => {
    expect(
      reconcileRange({
        range: { start: 900, end: 1000 },
        previous: limits,
        next: { ...limits, max: 1010 },
        initialSpan: 0,
      }),
    ).toEqual({ start: 910, end: 1010 });
  });

  it("окно в прошлом стоит на месте", () => {
    expect(
      reconcileRange({
        range: { start: 100, end: 200 },
        previous: limits,
        next: { ...limits, max: 1010 },
        initialSpan: 0,
      }),
    ).toEqual({ start: 100, end: 200 });
  });

  it("скользящее окно данных поджимает окно в прошлом", () => {
    expect(
      reconcileRange({
        range: { start: 0, end: 100 },
        previous: limits,
        next: { ...limits, min: 50, max: 1050 },
        initialSpan: 0,
      }),
    ).toEqual({ start: 50, end: 150 });
  });
});

describe("matchSpanPreset", () => {
  const presets = [
    { key: "day", span: 100 },
    { key: "week", span: 700 },
    { key: "all", span: "all" as const },
  ];

  it("пресет по ширине окна с допуском", () => {
    expect(matchSpanPreset(101, 1000, presets, 0.02)).toBe("day");
    expect(matchSpanPreset(1000, 1000, presets, 0.02)).toBe("all");
    expect(matchSpanPreset(300, 1000, presets, 0.02)).toBeNull();
  });

  it("окно на всех данных — «всё», даже если пресет шире данных", () => {
    expect(matchSpanPreset(500, 500, presets, 0.02)).toBe("all");
  });

  it("без «всё» — пресет шире данных", () => {
    expect(matchSpanPreset(500, 500, presets.slice(0, 2), 0.02)).toBe("week");
  });
});

describe("worklet", () => {
  it("функции объявлены как worklet", () => {
    for (const fn of [
      clampRange,
      zoomRange,
      panRange,
      anchoredRange,
      rubberRange,
      isFullRange,
      isAtEnd,
      lastRange,
      reconcileRange,
      matchSpanPreset,
    ]) {
      expect(fn.toString()).toMatch(/["']worklet["']/);
    }
  });
});

describe("autoMinSpan", () => {
  it("пять средних интервалов самой частой серии", () => {
    expect(
      autoMinSpan([
        { data: [{ x: 0 }, { x: 10 }, { x: 20 }] },
        { data: [{ x: 0 }, { x: 2 }, { x: 4 }] },
      ]),
    ).toBe(10);
  });

  it("мало точек — 0", () => {
    expect(autoMinSpan([{ data: [{ x: 1 }] }])).toBe(0);
  });
});

describe("resolveViewPin / pinnedRange", () => {
  it("привязка окна к данным", () => {
    expect(resolveViewPin({ start: 0, end: 1000 }, limits)).toBe("all");
    expect(resolveViewPin({ start: 900, end: 1000 }, limits)).toBe("end");
    expect(resolveViewPin({ start: 100, end: 200 }, limits)).toBe("none");
    expect(resolveViewPin({ start: NaN, end: NaN }, limits)).toBe("none");
  });

  it("после жеста окно догоняет данные по привязке", () => {
    const grown = { ...limits, max: 1100 };

    expect(pinnedRange("all", { start: 0, end: 1000 }, grown)).toEqual({
      start: 0,
      end: 1100,
    });
    expect(pinnedRange("end", { start: 900, end: 1000 }, grown)).toEqual({
      start: 1000,
      end: 1100,
    });
    expect(pinnedRange("none", { start: 0, end: 10 }, grown)).toBeNull();
  });
});
