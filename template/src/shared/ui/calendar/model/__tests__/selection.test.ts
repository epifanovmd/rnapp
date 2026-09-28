import type { TCalendarSelectionState } from "../../calendar.types";
import {
  clearSelection,
  firstSelectedKey,
  selectDay,
  selectionStateFromProps,
  selectionStateFromValue,
  selectionStateToValue,
} from "../selection";

describe("selection: single", () => {
  it("выбирает и не снимает без allowDeselect", () => {
    const s0: TCalendarSelectionState = { mode: "single", key: null };
    const s1 = selectDay(s0, "2026-09-10");

    expect(s1).toEqual({ mode: "single", key: "2026-09-10" });
    expect(selectDay(s1, "2026-09-10")).toBe(s1);
    expect(selectDay(s1, "2026-09-10", { allowDeselect: true })).toEqual({
      mode: "single",
      key: null,
    });
  });
});

describe("selection: multiple", () => {
  it("тогглит дни, держит сортировку и лимит", () => {
    const s0: TCalendarSelectionState = { mode: "multiple", keys: [] };
    const s1 = selectDay(s0, "2026-09-20");
    const s2 = selectDay(s1, "2026-09-05");

    expect(s2).toEqual({
      mode: "multiple",
      keys: ["2026-09-05", "2026-09-20"],
    });
    expect(selectDay(s2, "2026-09-20")).toEqual({
      mode: "multiple",
      keys: ["2026-09-05"],
    });
    expect(selectDay(s2, "2026-09-25", { max: 2 })).toBe(s2);
  });
});

describe("selection: range", () => {
  const empty: TCalendarSelectionState = {
    mode: "range",
    start: null,
    end: null,
  };

  it("первый тап — начало, второй позже — конец", () => {
    const s1 = selectDay(empty, "2026-09-10");
    const s2 = selectDay(s1, "2026-09-15");

    expect(s1).toEqual({ mode: "range", start: "2026-09-10", end: null });
    expect(s2).toEqual({
      mode: "range",
      start: "2026-09-10",
      end: "2026-09-15",
    });
  });

  it("тап раньше начала — новое начало; тап по закрытому периоду — заново", () => {
    const s1 = selectDay(empty, "2026-09-10");

    expect(selectDay(s1, "2026-09-03")).toEqual({
      mode: "range",
      start: "2026-09-03",
      end: null,
    });

    const closed = selectDay(s1, "2026-09-15");

    expect(selectDay(closed, "2026-09-12")).toEqual({
      mode: "range",
      start: "2026-09-12",
      end: null,
    });
  });

  it("период из одного дня — по allowSingleDay", () => {
    const s1 = selectDay(empty, "2026-09-10");

    expect(selectDay(s1, "2026-09-10")).toEqual({
      mode: "range",
      start: "2026-09-10",
      end: "2026-09-10",
    });
    expect(selectDay(s1, "2026-09-10", { allowSingleDay: false })).toBe(s1);
  });

  it("maxLength: превышение начинает новый период", () => {
    const s1 = selectDay(empty, "2026-09-10");

    expect(selectDay(s1, "2026-09-12", { maxLength: 3 })).toEqual({
      mode: "range",
      start: "2026-09-10",
      end: "2026-09-12",
    });
    expect(selectDay(s1, "2026-09-13", { maxLength: 3 })).toEqual({
      mode: "range",
      start: "2026-09-13",
      end: null,
    });
  });
});

describe("selection: конвертации", () => {
  it("fromProps: value/defaultValue, дедуп и сортировка, нормализация периода", () => {
    expect(
      selectionStateFromProps({ mode: "single", value: "2026-01-02" }, false),
    ).toEqual({ mode: "single", key: "2026-01-02" });
    expect(
      selectionStateFromProps(
        { mode: "single", defaultValue: "2026-01-02" },
        true,
      ),
    ).toEqual({ mode: "single", key: "2026-01-02" });
    expect(
      selectionStateFromProps(
        { mode: "multiple", value: ["2026-02-01", "2026-01-01", "2026-02-01"] },
        false,
      ),
    ).toEqual({ mode: "multiple", keys: ["2026-01-01", "2026-02-01"] });
    expect(
      selectionStateFromProps(
        { mode: "range", value: { start: "2026-03-10", end: "2026-03-01" } },
        false,
      ),
    ).toEqual({ mode: "range", start: "2026-03-01", end: "2026-03-10" });
    expect(
      selectionStateFromProps(
        { mode: "range", value: { end: "2026-03-01" } },
        false,
      ),
    ).toEqual({ mode: "range", start: null, end: null });
    expect(selectionStateFromProps({}, false)).toEqual({ mode: "none" });
  });

  it("toValue ↔ fromValue круговая конвертация", () => {
    const state: TCalendarSelectionState = {
      mode: "range",
      start: "2026-03-01",
      end: "2026-03-10",
    };
    const value = selectionStateToValue(state, "en");

    expect(value.mode).toBe("range");
    if (value.mode === "range") {
      expect(value.value.start?.format("YYYY-MM-DD")).toBe("2026-03-01");
      expect(value.value.end?.format("YYYY-MM-DD")).toBe("2026-03-10");
    }
    expect(selectionStateFromValue(value)).toEqual(state);
  });

  it("clear / firstSelectedKey", () => {
    const multi: TCalendarSelectionState = {
      mode: "multiple",
      keys: ["2026-01-05", "2026-01-09"],
    };

    expect(clearSelection(multi)).toEqual({ mode: "multiple", keys: [] });
    expect(firstSelectedKey(multi)).toBe("2026-01-05");
    expect(firstSelectedKey({ mode: "none" })).toBeNull();
  });
});
