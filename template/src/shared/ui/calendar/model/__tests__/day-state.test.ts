import {
  buildSelectionIndex,
  isSpanAffected,
  resolveDayFlags,
  resolveRangeFill,
} from "../day-state";

describe("day-state", () => {
  it("range: начало/конец/между/вне", () => {
    const index = buildSelectionIndex({
      mode: "range",
      start: "2026-09-10",
      end: "2026-09-15",
    });

    expect(resolveDayFlags("2026-09-10", index)).toEqual({
      isSelected: true,
      isRangeStart: true,
      isRangeEnd: false,
      isRangeOpen: false,
      isInRange: false,
    });
    expect(resolveDayFlags("2026-09-15", index)).toMatchObject({
      isSelected: true,
      isRangeEnd: true,
    });
    expect(resolveDayFlags("2026-09-12", index)).toMatchObject({
      isSelected: false,
      isInRange: true,
    });
    expect(resolveDayFlags("2026-09-16", index).isInRange).toBe(false);
  });

  it("range из одного дня — и начало, и конец", () => {
    const index = buildSelectionIndex({
      mode: "range",
      start: "2026-09-10",
      end: "2026-09-10",
    });

    expect(resolveDayFlags("2026-09-10", index)).toMatchObject({
      isRangeStart: true,
      isRangeEnd: true,
    });
  });

  it("multiple через Set; невыбранные дни делят один объект флагов", () => {
    const index = buildSelectionIndex({
      mode: "multiple",
      keys: ["2026-09-01"],
    });

    expect(resolveDayFlags("2026-09-01", index).isSelected).toBe(true);
    expect(resolveDayFlags("2026-09-02", index)).toBe(
      resolveDayFlags("2026-09-03", index),
    );
  });

  it("isSpanAffected для периода, пересекающего диапазон сетки", () => {
    const range = {
      mode: "range" as const,
      start: "2026-08-20",
      end: "2026-10-02",
    };

    expect(isSpanAffected("2026-08-31", "2026-10-04", range)).toBe(true);
    expect(isSpanAffected("2026-10-26", "2026-12-06", range)).toBe(false);
    expect(
      isSpanAffected("2026-08-31", "2026-10-04", {
        mode: "single",
        key: "2026-09-30",
      }),
    ).toBe(true);
    expect(isSpanAffected("2026-08-31", "2026-10-04", { mode: "none" })).toBe(
      false,
    );
  });

  it("выбор на хвосте соседнего месяца затрагивает сетку", () => {
    // Сетка сентября 2026 (с понедельника): 31.08 … 04.10.
    const from = "2026-08-31";
    const to = "2026-10-04";

    expect(
      isSpanAffected(from, to, { mode: "single", key: "2026-08-31" }),
    ).toBe(true);
    expect(
      isSpanAffected(from, to, { mode: "multiple", keys: ["2026-10-03"] }),
    ).toBe(true);
    expect(
      isSpanAffected(from, to, {
        mode: "range",
        start: "2026-10-01",
        end: "2026-10-10",
      }),
    ).toBe(true);
    expect(
      isSpanAffected(from, to, { mode: "single", key: "2026-08-30" }),
    ).toBe(false);
  });
});

describe("resolveRangeFill", () => {
  it("только начало периода — без полосы", () => {
    const index = buildSelectionIndex({
      mode: "range",
      start: "2026-09-02",
      end: null,
    });

    expect(resolveRangeFill(resolveDayFlags("2026-09-02", index))).toBe("none");
  });

  it("закрытый период: у начала правая половина, у конца левая, между — цельная", () => {
    const index = buildSelectionIndex({
      mode: "range",
      start: "2026-09-02",
      end: "2026-09-04",
    });

    expect(resolveRangeFill(resolveDayFlags("2026-09-02", index))).toBe(
      "right",
    );
    expect(resolveRangeFill(resolveDayFlags("2026-09-03", index))).toBe("full");
    expect(resolveRangeFill(resolveDayFlags("2026-09-04", index))).toBe("left");
  });

  it("период из одного дня — без полосы", () => {
    const index = buildSelectionIndex({
      mode: "range",
      start: "2026-09-02",
      end: "2026-09-02",
    });

    expect(resolveRangeFill(resolveDayFlags("2026-09-02", index))).toBe("none");
  });
});
