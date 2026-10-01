import type { LabeledValue, SelectValue } from "../types";

/** Значение Select в любом из режимов (single/multi × plain/labelInValue). */
export type RawSelectValue<V extends SelectValue> =
  V | V[] | LabeledValue<V> | LabeledValue<V>[] | null | undefined;

/** `LabeledValue`-значение режима labelInValue — массивом. */
export const toLabeledArray = <V extends SelectValue>(
  value: RawSelectValue<V>,
): LabeledValue<V>[] => {
  if (value == null) return [];

  return (Array.isArray(value) ? value : [value]) as LabeledValue<V>[];
};

/** Значение без подписей: `LabeledValue` → `value`, иначе как есть. */
export const unwrapLabeled = <V extends SelectValue>(
  value: RawSelectValue<V>,
  labelInValue: boolean,
): V | V[] | null | undefined => {
  if (!labelInValue || value == null)
    return value as V | V[] | null | undefined;
  if (Array.isArray(value))
    return (value as LabeledValue<V>[]).map(item => item.value);

  return (value as LabeledValue<V>).value;
};
