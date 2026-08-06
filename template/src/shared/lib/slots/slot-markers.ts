import type { SlotEntry, Tagged } from "./slot-meta";
import { COMPOUND_META, SLOT_META } from "./slot-meta";

/** Статики вложенного compound, если компонент слота сам compound. */
const nestedStatics = (component: unknown) => {
  if (typeof component !== "function" && typeof component !== "object") {
    return undefined;
  }

  return (component as Tagged | null)?.[COMPOUND_META]?.statics;
};

/**
 * Маркеры слотов: сами не рендерятся, несут метаданные владельца и наследуют
 * статики вложенного compound — `BottomSheet.Footer.PrimaryButton` появляется
 * без ручной сборки.
 */
export const createSlotMarkers = (
  ownerName: string,
  owner: symbol,
  entries: readonly SlotEntry[],
): Record<string, unknown> => {
  const statics: Record<string, unknown> = {};

  for (const entry of entries) {
    if (statics[entry.name]) {
      throw new Error(
        `${ownerName} declares more than one slot named "${entry.name}".`,
      );
    }

    const Marker = (() => {
      throw new Error(
        `${ownerName}.${entry.name} cannot be rendered standalone. ` +
          `Use it as a direct child of ${ownerName}.`,
      );
    }) as unknown as Tagged & { displayName: string };

    Marker.displayName = `${ownerName}.${entry.name}`;
    Marker[SLOT_META] = { entry, owner, ownerName };

    const nested = nestedStatics(entry.definition.component);

    if (nested) {
      Object.assign(Marker, nested);
    }

    statics[entry.name] = Marker;
  }

  return statics;
};
