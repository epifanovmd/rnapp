import React, { createRef } from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";

import type { ICalendarNavigator, ICalendarRef } from "../../calendar.types";
import { useCalendar } from "../calendar-context";
import { CalendarProvider, TCalendarProviderProps } from "../CalendarProvider";

type TSnapshot = ReturnType<typeof useCalendar>;
type TProps = TCalendarProviderProps<unknown>;

// react-test-renderer предупреждает об устаревании при каждом create — в node-окружении альтернативы ему нет.
const DEPRECATION = "react-test-renderer is deprecated";
const consoleError = console.error;

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes(DEPRECATION)) return;
    consoleError(...args);
  });
});

afterAll(() => jest.restoreAllMocks());

const Probe = ({ onRender }: { onRender: (s: TSnapshot) => void }) => {
  onRender(useCalendar());

  return null;
};

/** Провайдер без UI: снаружи — ref, изнутри — последний снимок контекстов. */
const mount = (props: TProps) => {
  const ref = createRef<ICalendarRef>();
  let latest: TSnapshot | null = null;
  const element = (p: TProps) => (
    <CalendarProvider ref={ref} {...p}>
      <Probe
        onRender={s => {
          latest = s;
        }}
      />
    </CalendarProvider>
  );
  let renderer!: ReactTestRenderer;

  act(() => {
    renderer = create(element(props));
  });

  return {
    ref,
    get state() {
      return latest!.state;
    },
    get actions() {
      return latest!.actions;
    },
    get config() {
      return latest!.config;
    },
    rerender: (p: TProps) => act(() => renderer.update(element(p))),
  };
};

const BASE: TProps = {
  locale: "en",
  firstDayOfWeek: 1,
  today: "2026-09-15",
  initialMonth: "2026-09",
};

const navigatorMock = (): jest.Mocked<ICalendarNavigator> => ({
  goToMonth: jest.fn(),
});

describe("CalendarProvider: месяц", () => {
  it("uncontrolled: goToNextMonth меняет месяц и один раз зовёт onMonthChange", () => {
    const onMonthChange = jest.fn();
    const c = mount({ ...BASE, onMonthChange });

    act(() => c.actions.goToNextMonth());

    expect(c.state.monthKey).toBe("2026-10");
    expect(onMonthChange).toHaveBeenCalledTimes(1);
    expect(onMonthChange.mock.calls[0]![1]).toBe("2026-10");
  });

  it("controlled: goToNextMonth сам месяц не меняет, а сообщает родителю", () => {
    const onMonthChange = jest.fn();
    const navigator = navigatorMock();
    const c = mount({ ...BASE, month: "2026-09", onMonthChange });

    act(() => c.actions.registerNavigator(navigator));
    act(() => c.actions.goToNextMonth(false));

    expect(c.state.monthKey).toBe("2026-09");
    expect(onMonthChange).toHaveBeenCalledTimes(1);
    expect(onMonthChange.mock.calls[0]![1]).toBe("2026-10");
    expect(navigator.goToMonth).not.toHaveBeenCalled();

    // Родитель принял новый месяц — вью едет к нему с тем же `animated`, что просили.
    c.rerender({ ...BASE, month: "2026-10", onMonthChange });

    expect(c.state.monthKey).toBe("2026-10");
    expect(navigator.goToMonth).toHaveBeenCalledWith("2026-10", false);
    expect(onMonthChange).toHaveBeenCalledTimes(1);
  });

  it("controlled: syncMonth от скролла списка сообщает родителю и не трогает вью", () => {
    const onMonthChange = jest.fn();
    const navigator = navigatorMock();
    const c = mount({ ...BASE, month: "2026-09", onMonthChange });

    act(() => c.actions.registerNavigator(navigator));
    act(() => c.actions.syncMonth("2026-11"));

    expect(c.state.monthKey).toBe("2026-09");
    expect(onMonthChange.mock.calls[0]![1]).toBe("2026-11");
    expect(navigator.goToMonth).not.toHaveBeenCalled();
  });

  it("uncontrolled: syncMonth на тот же месяц ничего не зовёт", () => {
    const onMonthChange = jest.fn();
    const c = mount({ ...BASE, onMonthChange });

    act(() => c.actions.syncMonth("2026-09"));

    expect(onMonthChange).not.toHaveBeenCalled();
  });
});

describe("CalendarProvider: тап по дню", () => {
  it("pressDay игнорирует недоступный день", () => {
    const onChange = jest.fn();
    const onDayPress = jest.fn();
    const c = mount({
      ...BASE,
      mode: "single",
      onChange,
      onDayPress,
      disabledDates: ["2026-09-10"],
    });

    act(() => c.actions.pressDay("2026-09-10"));

    expect(onChange).not.toHaveBeenCalled();
    expect(onDayPress).not.toHaveBeenCalled();

    act(() => c.actions.pressDay("2026-09-11"));

    expect(onChange.mock.calls[0]![0].format("YYYY-MM-DD")).toBe("2026-09-11");
    expect(onDayPress).toHaveBeenCalledTimes(1);
  });

  it("onDayPress для хвоста получает isOutside и месяц сетки, где тапнули", () => {
    const onDayPress = jest.fn();
    const c = mount({ ...BASE, onDayPress });

    act(() => c.actions.pressDay("2026-08-31", "2026-09"));

    expect(onDayPress).toHaveBeenCalledWith(
      expect.objectContaining({
        dateKey: "2026-08-31",
        isOutside: true,
        monthKey: "2026-09",
      }),
    );
  });

  it("ref.select не выбирает недоступный день", () => {
    const onChange = jest.fn();
    const c = mount({
      ...BASE,
      mode: "single",
      onChange,
      minDate: "2026-09-05",
    });

    act(() => c.ref.current?.select("2026-09-01"));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("CalendarProvider: controlled-выбор", () => {
  it("новый массив с тем же содержимым не меняет ссылку на selection", () => {
    const c = mount({ ...BASE, mode: "multiple", value: ["2026-09-01"] });
    const before = c.state.selection;

    c.rerender({ ...BASE, mode: "multiple", value: ["2026-09-01"] });

    expect(c.state.selection).toBe(before);
  });

  it("новые dayjs-объекты периода с теми же датами не меняют ссылку на selection", () => {
    const value = () => ({
      start: new Date(2026, 8, 1),
      end: new Date(2026, 8, 3),
    });
    const c = mount({ ...BASE, mode: "range", value: value() });
    const before = c.state.selection;

    c.rerender({ ...BASE, mode: "range", value: value() });

    expect(c.state.selection).toBe(before);
  });
});

describe("CalendarProvider: границы списка", () => {
  it("pastMonths/futureMonths ограничивают навигацию и canGoPrev/canGoNext", () => {
    const c = mount({ ...BASE, pastMonths: 1, futureMonths: 1 });

    act(() => c.actions.goToPrevMonth());
    act(() => c.actions.goToPrevMonth());

    expect(c.state.monthKey).toBe("2026-08");
    expect(c.state.canGoPrev).toBe(false);
    expect(c.state.canGoNext).toBe(true);
    expect(c.state.monthKey).toBe(c.config.monthBounds?.from);
    expect(c.config.monthBounds?.to).toBe("2026-10");
  });

  it("minDate имеет приоритет над pastMonths", () => {
    const c = mount({
      ...BASE,
      pastMonths: 6,
      futureMonths: 1,
      minDate: "2026-08-10",
    });

    expect(c.config.monthBounds).toEqual({ from: "2026-08", to: "2026-10" });
  });
});

describe("CalendarProvider: края списка", () => {
  it("список упёрся в край — соответствующая кнопка гаснет, хотя месяц не последний", () => {
    const c = mount({ ...BASE, pastMonths: 6, futureMonths: 6 });

    act(() => c.actions.syncScrollEdges({ atStart: false, atEnd: true }));

    expect(c.state.monthKey).toBe("2026-09");
    expect(c.state.canGoNext).toBe(false);
    expect(c.state.canGoPrev).toBe(true);

    act(() => c.actions.syncScrollEdges({ atStart: true, atEnd: false }));

    expect(c.state.canGoPrev).toBe(false);
    expect(c.state.canGoNext).toBe(true);
  });

  it("одинаковые края повторно состояние не меняют", () => {
    const c = mount({ ...BASE, pastMonths: 6, futureMonths: 6 });

    act(() => c.actions.syncScrollEdges({ atStart: false, atEnd: true }));
    const before = c.state;

    act(() => c.actions.syncScrollEdges({ atStart: false, atEnd: true }));

    expect(c.state).toBe(before);
  });
});

describe("CalendarProvider: последний месяц списка", () => {
  it("на последнем месяце диапазона canGoNext = false, дальше не уходим", () => {
    const c = mount({ ...BASE, pastMonths: 24, futureMonths: 24 });

    act(() => c.actions.goToMonth("2028-09-01"));

    expect(c.state.monthKey).toBe("2028-09");
    expect(c.state.canGoNext).toBe(false);

    act(() => c.actions.goToNextMonth());

    expect(c.state.monthKey).toBe("2028-09");
  });
});
