import type { ReactNode } from "react";

import type {
  AnyProps,
  SlotEntry,
  SlotResolution,
  SlotValue,
  SlotValues,
} from "./slot-runtime";
import { eachChild } from "./slot-runtime";

/**
 * Object-стратегия: значения берутся из prop `slots`, дети целиком уходят в
 * контент — маркеры среди них не ищутся, обход детей не рекурсивный по слотам.
 */
export const resolveFromObject = (
  children: ReactNode,
  objectSlots: Record<string, unknown>,
  entries: readonly SlotEntry[],
): SlotResolution => {
  const values: SlotValues = {};
  const contentItems: ReactNode[] = [];

  for (const entry of entries) {
    const input = objectSlots[entry.key];

    if (input !== undefined) {
      values[entry.key] = entry.multiple
        ? (input as SlotValue[])
        : { props: input as AnyProps };
    }
  }

  eachChild(children, node => contentItems.push(node));

  return { contentItems, values };
};
