import dayjs from "dayjs";

import type {
  ICalendarRange,
  TCalendarDateKey,
  TCalendarSelectionProps,
  TCalendarSelectionState,
  TCalendarSelectionValue,
} from "../calendar.types";
import { keyToDayjs, toDateKey } from "./date-key";

export interface ISelectionRules {
  allowDeselect?: boolean;
  max?: number;
  allowSingleDay?: boolean;
  maxLength?: number;
}

/** Количество дней в периоде включительно. */
const rangeLength = (start: TCalendarDateKey, end: TCalendarDateKey) =>
  dayjs(end).diff(dayjs(start), "day") + 1;

/**
 * Что происходит с выбором при тапе по дню. Если тап ничего не меняет,
 * возвращается тот же объект состояния — по нему удобно понять, что менять нечего.
 */
export const selectDay = (
  state: TCalendarSelectionState,
  key: TCalendarDateKey,
  rules: ISelectionRules = {},
): TCalendarSelectionState => {
  switch (state.mode) {
    case "none":
      return state;

    case "single": {
      if (state.key === key) {
        return rules.allowDeselect ? { mode: "single", key: null } : state;
      }

      return { mode: "single", key };
    }

    case "multiple": {
      if (state.keys.includes(key)) {
        return { mode: "multiple", keys: state.keys.filter(k => k !== key) };
      }
      if (rules.max !== undefined && state.keys.length >= rules.max) {
        return state;
      }

      return { mode: "multiple", keys: [...state.keys, key].sort() };
    }

    case "range": {
      const { start, end } = state;
      const allowSingleDay = rules.allowSingleDay ?? true;

      // Нет начала или период уже закрыт — начинаем заново.
      if (!start || end) {
        return { mode: "range", start: key, end: null };
      }
      if (key === start) {
        return allowSingleDay ? { mode: "range", start, end: start } : state;
      }
      // Тап раньше начала — новое начало.
      if (key < start) {
        return { mode: "range", start: key, end: null };
      }
      if (
        rules.maxLength !== undefined &&
        rangeLength(start, key) > rules.maxLength
      ) {
        return { mode: "range", start: key, end: null };
      }

      return { mode: "range", start, end: key };
    }
  }
};

export const clearSelection = (
  state: TCalendarSelectionState,
): TCalendarSelectionState => {
  switch (state.mode) {
    case "none":
      return state;
    case "single":
      return { mode: "single", key: null };
    case "multiple":
      return { mode: "multiple", keys: [] };
    case "range":
      return { mode: "range", start: null, end: null };
  }
};

const normalizeRange = (
  range: { start?: unknown; end?: unknown } | null | undefined,
): { start: TCalendarDateKey | null; end: TCalendarDateKey | null } => {
  const start = toDateKey(range?.start as never);
  const end = toDateKey(range?.end as never);

  if (start && end && end < start) {
    return { start: end, end: start };
  }

  return { start, end: start ? end : null };
};

/** Состояние из пропсов режима: `value` для controlled, `defaultValue` для стартового значения. */
export const selectionStateFromProps = (
  props: TCalendarSelectionProps,
  useDefault: boolean,
): TCalendarSelectionState => {
  const mode = props.mode ?? "none";

  switch (mode) {
    case "none":
      return { mode: "none" };
    case "single": {
      const p = props as Extract<TCalendarSelectionProps, { mode: "single" }>;
      const raw = useDefault ? p.defaultValue : p.value;

      return { mode: "single", key: toDateKey(raw) };
    }
    case "multiple": {
      const p = props as Extract<TCalendarSelectionProps, { mode: "multiple" }>;
      const raw = (useDefault ? p.defaultValue : p.value) ?? [];
      const keys = raw
        .map(toDateKey)
        .filter((k): k is TCalendarDateKey => k !== null);

      return { mode: "multiple", keys: Array.from(new Set(keys)).sort() };
    }
    case "range": {
      const p = props as Extract<TCalendarSelectionProps, { mode: "range" }>;
      const raw = useDefault ? p.defaultValue : p.value;

      return { mode: "range", ...normalizeRange(raw) };
    }
  }
};

/** Состояние из значения, пришедшего через `ref.setSelection`. */
export const selectionStateFromValue = (
  value: TCalendarSelectionValue,
): TCalendarSelectionState => {
  switch (value.mode) {
    case "none":
      return { mode: "none" };
    case "single":
      return { mode: "single", key: toDateKey(value.value) };
    case "multiple":
      return {
        mode: "multiple",
        keys: Array.from(
          new Set(
            value.value
              .map(toDateKey)
              .filter((k): k is TCalendarDateKey => k !== null),
          ),
        ).sort(),
      };
    case "range":
      return { mode: "range", ...normalizeRange(value.value) };
  }
};

/** Состояние в виде, который отдаём наружу: dayjs-объекты в локали календаря. */
export const selectionStateToValue = (
  state: TCalendarSelectionState,
  locale: string,
): TCalendarSelectionValue => {
  switch (state.mode) {
    case "none":
      return { mode: "none" };
    case "single":
      return {
        mode: "single",
        value: state.key ? keyToDayjs(state.key, locale) : null,
      };
    case "multiple":
      return {
        mode: "multiple",
        value: state.keys.map(k => keyToDayjs(k, locale)),
      };
    case "range": {
      const range: ICalendarRange = {
        start: state.start ? keyToDayjs(state.start, locale) : null,
        end: state.end ? keyToDayjs(state.end, locale) : null,
      };

      return { mode: "range", value: range };
    }
  }
};

/** Первый выбранный день — от него считается стартовый месяц. */
export const firstSelectedKey = (
  state: TCalendarSelectionState,
): TCalendarDateKey | null => {
  switch (state.mode) {
    case "none":
      return null;
    case "single":
      return state.key;
    case "multiple":
      return state.keys[0] ?? null;
    case "range":
      return state.start;
  }
};
