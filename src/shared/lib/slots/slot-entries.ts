import type { SlotSchema } from "./slot.types";
import { createEmptyHandle } from "./slot-handle";
import { mergeSlotProps } from "./slot-merge";
import type { SlotEntry, SlotMergeFn } from "./slot-meta";

const capitalize = (value: string) =>
  value.length ? value[0].toUpperCase() + value.slice(1) : value;

/** Разворачивает схему в записи с политикой слияния и хендлом пустого слота. */
export const createSlotEntries = (schema: SlotSchema): SlotEntry[] =>
  Object.entries(schema).map(([key, definition]) => {
    const entry: SlotEntry = {
      definition,
      empty: undefined as never,
      key,
      merge: (definition.mergeProps ?? mergeSlotProps.compose) as SlotMergeFn,
      multiple: definition.multiple === true,
      name: capitalize(key),
    };

    entry.empty = createEmptyHandle(entry);

    return entry;
  });
