import type {
  TCalendarDateKey,
  TCalendarSelectionState,
} from "../calendar.types";

export interface IDaySelectionFlags {
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  /** Начало периода выбрано, конец ещё нет. */
  isRangeOpen: boolean;
  isInRange: boolean;
}

const NONE: IDaySelectionFlags = {
  isSelected: false,
  isRangeStart: false,
  isRangeEnd: false,
  isRangeOpen: false,
  isInRange: false,
};

/** Выбор в удобной для проверок форме: для `multiple` — Set ключей. Строится один раз на состояние. */
export interface ISelectionIndex {
  state: TCalendarSelectionState;
  keys: ReadonlySet<TCalendarDateKey>;
}

export const buildSelectionIndex = (
  state: TCalendarSelectionState,
): ISelectionIndex => ({
  state,
  keys: new Set(state.mode === "multiple" ? state.keys : []),
});

/** Флаги выбора для дня. Дни вне выбора получают один общий объект `NONE`. */
export const resolveDayFlags = (
  key: TCalendarDateKey,
  { state, keys }: ISelectionIndex,
): IDaySelectionFlags => {
  switch (state.mode) {
    case "none":
      return NONE;
    case "single":
      return state.key === key ? { ...NONE, isSelected: true } : NONE;
    case "multiple":
      return keys.has(key) ? { ...NONE, isSelected: true } : NONE;
    case "range": {
      const { start, end } = state;

      if (!start) return NONE;

      const isRangeStart = key === start;
      const isRangeEnd = end !== null && key === end;

      if (isRangeStart || isRangeEnd) {
        return {
          isSelected: true,
          isRangeStart,
          isRangeEnd,
          isRangeOpen: isRangeStart && end === null,
          isInRange: false,
        };
      }
      if (end !== null && key > start && key < end) {
        return { ...NONE, isInRange: true };
      }

      return NONE;
    }
  }
};

export type TRangeFill = "none" | "left" | "right" | "full";

/**
 * Какую часть ячейки закрасить полосой периода. Дни между началом и концом —
 * целиком, одной заливкой: две половины при дробной ширине ячейки дают шов.
 * Пока период не закрыт, полосы нет.
 */
export const resolveRangeFill = ({
  isRangeStart,
  isRangeEnd,
  isRangeOpen,
  isInRange,
}: IDaySelectionFlags): TRangeFill => {
  if (isInRange) return "full";
  if (isRangeStart && isRangeEnd) return "none";
  if (isRangeStart) return isRangeOpen ? "none" : "right";
  if (isRangeEnd) return "left";

  return "none";
};

/** Попадает ли хоть один выбранный день в диапазон `from..to` (включительно). */
export const isSpanAffected = (
  from: TCalendarDateKey,
  to: TCalendarDateKey,
  state: TCalendarSelectionState,
): boolean => {
  switch (state.mode) {
    case "none":
      return false;
    case "single":
      return state.key !== null && state.key >= from && state.key <= to;
    case "multiple":
      return state.keys.some(k => k >= from && k <= to);
    case "range": {
      if (!state.start) return false;
      const end = state.end ?? state.start;

      return state.start <= to && end >= from;
    }
  }
};
