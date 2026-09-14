import { useLatestRef } from "@shared/lib/hooks";
import { useCallback, useMemo, useState } from "react";

import type {
  TCalendarDateKey,
  TCalendarSelectionProps,
  TCalendarSelectionState,
  TCalendarSelectionValue,
} from "../calendar.types";
import {
  clearSelection,
  ISelectionRules,
  selectDay,
  selectionStateFromProps,
  selectionStateFromValue,
  selectionStateToValue,
} from "../model";

/** Что именно из controlled-значения отслеживать. Кортеж фиксированной длины — иначе useMemo ругается. */
const selectionDeps = (
  props: TCalendarSelectionProps,
): [string, unknown, unknown] => {
  switch (props.mode) {
    case "single":
      return ["single", props.value, null];
    case "multiple":
      return ["multiple", props.value, null];
    case "range":
      return ["range", props.value?.start, props.value?.end];
    default:
      return ["none", null, null];
  }
};

const rulesOf = (props: TCalendarSelectionProps): ISelectionRules => {
  switch (props.mode) {
    case "single":
      return { allowDeselect: props.allowDeselect };
    case "multiple":
      return { max: props.max };
    case "range":
      return {
        allowSingleDay: props.allowSingleDay,
        maxLength: props.maxLength,
      };
    default:
      return {};
  }
};

const isControlled = (props: TCalendarSelectionProps) =>
  (props.mode === "single" ||
    props.mode === "multiple" ||
    props.mode === "range") &&
  props.value !== undefined;

const emit = (
  props: TCalendarSelectionProps,
  next: TCalendarSelectionState,
  locale: string,
) => {
  const value = selectionStateToValue(next, locale);

  // Сужаем оба union одновременно по одному и тому же `mode`, чтобы типы onChange и value совпали.
  if (props.mode === "single" && value.mode === "single") {
    props.onChange?.(value.value);
  } else if (props.mode === "multiple" && value.mode === "multiple") {
    props.onChange?.(value.value);
  } else if (props.mode === "range" && value.mode === "range") {
    props.onChange?.(value.value);
  }
};

export interface ICalendarSelectionApi {
  selection: TCalendarSelectionState;
  pressDay: (key: TCalendarDateKey) => void;
  setSelection: (value: TCalendarSelectionValue) => void;
  clear: () => void;
  getValue: () => TCalendarSelectionValue;
}

/**
 * Состояние выбора. Если у режима передан `value` — компонент controlled:
 * состояние берётся из пропсов, а тапы только вызывают `onChange`. Иначе
 * состояние живёт внутри и стартует с `defaultValue`.
 */
export const useCalendarSelection = (
  props: TCalendarSelectionProps,
  locale: string,
): ICalendarSelectionApi => {
  const [internal, setInternal] = useState<TCalendarSelectionState>(() =>
    selectionStateFromProps(props, true),
  );
  const controlled = isControlled(props);
  const [depMode, depA, depB] = selectionDeps(props);
  const fromProps = useMemo(
    () => selectionStateFromProps(props, false),
    // Пересчитываем только при смене controlled-значения — остальные пропсы на состояние не влияют.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [depMode, depA, depB],
  );

  const selection = controlled ? fromProps : internal;

  const propsRef = useLatestRef(props);
  const selectionRef = useLatestRef(selection);
  const localeRef = useLatestRef(locale);

  const commit = useCallback(
    (next: TCalendarSelectionState) => {
      if (next === selectionRef.current) return;
      if (!isControlled(propsRef.current)) setInternal(next);
      emit(propsRef.current, next, localeRef.current);
    },
    [localeRef, propsRef, selectionRef],
  );

  const pressDay = useCallback(
    (key: TCalendarDateKey) =>
      commit(selectDay(selectionRef.current, key, rulesOf(propsRef.current))),
    [commit, propsRef, selectionRef],
  );

  const setSelection = useCallback(
    (value: TCalendarSelectionValue) => commit(selectionStateFromValue(value)),
    [commit],
  );

  const clear = useCallback(
    () => commit(clearSelection(selectionRef.current)),
    [commit, selectionRef],
  );

  const getValue = useCallback(
    () => selectionStateToValue(selectionRef.current, localeRef.current),
    [localeRef, selectionRef],
  );

  return useMemo(
    () => ({ selection, pressDay, setSelection, clear, getValue }),
    [selection, pressDay, setSelection, clear, getValue],
  );
};
