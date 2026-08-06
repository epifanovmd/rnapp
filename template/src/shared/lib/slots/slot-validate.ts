import type { ResolvedSlots, SlotSchema } from "./slot.types";
import type { ResolveContext, SlotEntry, SlotMeta } from "./slot-meta";

/** Все проверки вызываются только под `__DEV__` — в prod их нет в рантайме. */

export const assertOwnSlot = (
  { ownerName }: ResolveContext,
  meta: SlotMeta,
  entry: SlotEntry | undefined,
) => {
  if (!entry) {
    throw new Error(
      `${ownerName} received ${meta.ownerName}.${meta.entry.name}. ` +
        `The slot belongs to ${meta.ownerName}.`,
    );
  }
};

export const assertSingleValue = (
  { ownerName }: ResolveContext,
  entry: SlotEntry,
  current: unknown,
) => {
  if (current !== undefined) {
    throw new Error(
      `${ownerName} received duplicate slot "${entry.key}". ` +
        `Declare it with multiple: true if repetition is expected.`,
    );
  }
};

export const assertRequiredSlots = <S extends SlotSchema>(
  ownerName: string,
  entries: readonly SlotEntry[],
  slots: ResolvedSlots<S>,
) => {
  for (const entry of entries) {
    if (
      entry.definition.required &&
      !(slots as Record<string, { present: boolean }>)[entry.key].present
    ) {
      throw new Error(`${ownerName}: required slot "${entry.key}" is missing.`);
    }
  }
};
