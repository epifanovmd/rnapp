import type { ReactNode } from "react";
import React, { forwardRef, memo } from "react";

import { resolveFromChildren } from "./resolve-children";
import { resolveFromObject } from "./resolve-object";
import type {
  CompoundComponent,
  CompoundConfig,
  CompoundProps,
  CompoundResolution,
  CompoundSlotInput,
  SlotSchema,
} from "./slot.types";
import { createSlotEntries } from "./slot-entries";
import { resolveHandles } from "./slot-handle";
import { createSlotMarkers } from "./slot-markers";
import type { ResolveContext, SlotValues } from "./slot-meta";
import { COMPOUND_META, isDev } from "./slot-meta";
import { assertRequiredSlots } from "./slot-validate";

/** Несколько узлов отдаются фрагментом, иначе React потребует ключи. */
const toContent = (items: ReactNode[]): ReactNode => {
  if (items.length === 0) {
    return undefined;
  }

  return items.length === 1
    ? items[0]
    : React.createElement(React.Fragment, null, ...items);
};

/**
 * Создаёт compound-компонент: слоты объявляются схемой, распознаются по
 * метаданным владельца (не по имени) и резолвятся за один проход по детям.
 * Корень вызывается функцией — лишнего фибера между ним и compound нет.
 */
export const createCompound =
  <P extends object, R = never>() =>
  <const S extends SlotSchema>(
    config: CompoundConfig<P, S, R>,
  ): CompoundComponent<P, S, R> => {
    const owner = Symbol(config.name);
    const entries = createSlotEntries(config.slots);
    const context: ResolveContext = { entries, owner, ownerName: config.name };
    const statics = createSlotMarkers(config.name, owner, entries);

    const resolveSlots = (
      children?: ReactNode,
      objectSlots?: CompoundSlotInput<S>,
    ): CompoundResolution<S> => {
      const values: SlotValues = {};
      const contentItems = resolveFromChildren(children, context, values);
      const slots = resolveHandles<S>(
        entries,
        values,
        objectSlots
          ? resolveFromObject(objectSlots as Record<string, unknown>, entries)
          : undefined,
      );

      if (isDev()) {
        assertRequiredSlots(config.name, entries, slots);
      }

      return {
        content: toContent(contentItems),
        hasContent: contentItems.length > 0,
        slots,
      };
    };

    const CompoundImpl = forwardRef<R, CompoundProps<P, S>>(
      (publicProps, forwardedRef) => {
        const {
          children,
          slots: objectSlots,
          ...props
        } = publicProps as CompoundProps<P, S> & {
          children?: ReactNode;
          slots?: CompoundSlotInput<S>;
        };
        const { content, hasContent, slots } = resolveSlots(
          children,
          objectSlots,
        );

        return config.render({
          content,
          forwardedRef,
          hasContent,
          props: props as Omit<P, "children" | "slots">,
          slots,
        });
      },
    );

    CompoundImpl.displayName = config.name;

    const Compound = memo(CompoundImpl);

    Compound.displayName = config.name;

    return Object.assign(Compound, statics, {
      [COMPOUND_META]: { name: config.name, owner, statics },
      resolveSlots,
    }) as unknown as CompoundComponent<P, S, R>;
  };
