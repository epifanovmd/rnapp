import type {
  ComponentType,
  ElementType,
  ReactElement,
  ReactNode,
} from "react";
import React, { forwardRef, memo, useMemo } from "react";

import { resolveFromChildren } from "./resolve-children";
import { resolveFromObject } from "./resolve-object";
import type {
  CompoundComponent,
  CompoundConfig,
  CompoundProps,
  CompoundResolution,
  CompoundSlotInput,
  SlotDefinition,
  SlotOptions,
  SlotSchema,
} from "./slot.types";
import type { SlotMarker, Tagged } from "./slot-runtime";
import {
  COMPOUND_META,
  createSlotEntries,
  isSameOwner,
  resolveHandles,
  SLOT_META,
} from "./slot-runtime";

export { mergeSlotProps } from "./slot-runtime";

/** Объявление слота: типы props задаются явно, флаги — литералами опций. */
export function slot<P extends object>(): SlotDefinition<P>;
export function slot<P extends object>(
  options: SlotOptions<P>,
): SlotDefinition<P>;
export function slot<P extends object>(
  options: SlotOptions<P, true> & { multiple: true },
): SlotDefinition<P, true>;
export function slot<P extends object>(
  options: SlotOptions<P, false, true> & { required: true },
): SlotDefinition<P, false, true>;
export function slot<P extends object>(
  options: SlotOptions<P, true, true> & { multiple: true; required: true },
): SlotDefinition<P, true, true>;
export function slot<P extends object>(
  options: SlotOptions<P, boolean, boolean> = {},
): SlotDefinition<P, boolean, boolean> {
  return options as SlotDefinition<P, boolean, boolean>;
}

/** Принадлежит ли узел слоту (опционально — слоту конкретного компонента). */
export const isSlotElement = (
  node: ReactNode,
  compound?: ElementType,
): node is ReactElement => {
  if (!React.isValidElement(node)) {
    return false;
  }

  const meta = (node.type as Tagged)[SLOT_META];
  const compoundMeta = (compound as Tagged | undefined)?.[COMPOUND_META];

  return (
    !!meta &&
    (!compoundMeta || isSameOwner(compoundMeta.owner, compoundMeta.name, meta))
  );
};

/**
 * Создаёт compound-компонент: слоты объявляются схемой, распознаются по
 * метаданным владельца (не по имени) и резолвятся за один проход по детям.
 */
export const createCompound =
  <P extends object, R = unknown>() =>
  <const S extends SlotSchema>(
    config: CompoundConfig<P, R, S>,
  ): CompoundComponent<P, R, S> => {
    const owner = Symbol(config.name);
    const entries = createSlotEntries(config.slots);
    const statics: Record<string, SlotMarker> = {};

    for (const entry of entries) {
      const { name } = entry;

      if (statics[name]) {
        throw new Error(
          `${config.name} declares more than one slot named "${name}".`,
        );
      }

      const Marker = (() => {
        throw new Error(
          `${config.name}.${name} cannot be rendered standalone. ` +
            `Use it as a direct child of ${config.name}.`,
        );
      }) as unknown as SlotMarker;

      Marker.displayName = `${config.name}.${name}`;
      Marker[SLOT_META] = { entry, owner, ownerName: config.name };
      statics[name] = Marker;
    }

    const resolveSlots = (
      children: ReactNode,
      objectSlots?: CompoundSlotInput<S>,
    ): CompoundResolution<S> => {
      const { contentItems, values } = objectSlots
        ? resolveFromObject(
            children,
            objectSlots as Record<string, unknown>,
            entries,
          )
        : resolveFromChildren(children, owner, config.name, entries);

      return {
        content: contentItems.length > 0 ? contentItems : undefined,
        contentItems,
        slots: resolveHandles<S>(config.name, entries, values),
      };
    };

    const CompoundImpl = forwardRef<R, CompoundProps<P, S>>(
      (publicProps, forwardedRef) => {
        const {
          children,
          slots: objectSlots,
          ...props
        } = publicProps as unknown as CompoundProps<P, S> & {
          children?: ReactNode;
          slots?: CompoundSlotInput<S>;
        };
        const resolved = useMemo(
          () => resolveSlots(children, objectSlots),
          [children, objectSlots],
        );

        return React.createElement(config.render as ComponentType<any>, {
          content: resolved.content,
          contentItems: resolved.contentItems,
          forwardedRef,
          props,
          slots: resolved.slots,
        });
      },
    );

    CompoundImpl.displayName = config.name;

    const Compound = memo(CompoundImpl);

    Compound.displayName = config.name;

    return Object.assign(Compound, statics, {
      [COMPOUND_META]: { name: config.name, owner },
      resolveSlots,
    }) as unknown as CompoundComponent<P, R, S>;
  };
