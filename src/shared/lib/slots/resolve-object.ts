import type { AnyProps, SlotEntry, SlotValue, SlotValues } from "./slot-meta";

/**
 * Object-стратегия: значения берутся из prop `slots` и служат базой — значения
 * из детей их перекрывают. Дети здесь не обходятся.
 */
export const resolveFromObject = (
  input: Record<string, unknown>,
  entries: readonly SlotEntry[],
): SlotValues => {
  const values: SlotValues = {};

  for (const entry of entries) {
    const value = input[entry.key];

    if (value === undefined) {
      continue;
    }

    values[entry.key] = entry.multiple
      ? (value as SlotValue[])
      : { props: value as AnyProps };
  }

  return values;
};
