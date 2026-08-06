import type { ComponentProps, ElementType } from "react";

import type {
  CompoundStaticsOf,
  SlotComponentOptions,
  SlotDefinition,
  SlotOptions,
} from "./slot.types";

/**
 * Объявление слота. `slot<P>()` — слот без компонента (рендерится содержимое),
 * `slot.of(Component)` — слот с компонентом: props и статики вложенного
 * compound выводятся из него.
 */
interface SlotFactory {
  <P extends object>(): SlotDefinition<P>;
  <P extends object>(
    options: SlotOptions<P, true, true> & { multiple: true; required: true },
  ): SlotDefinition<P, true, true>;
  <P extends object>(
    options: SlotOptions<P, false, true> & { required: true },
  ): SlotDefinition<P, false, true>;
  <P extends object>(
    options: SlotOptions<P, true> & { multiple: true },
  ): SlotDefinition<P, true>;
  <P extends object>(options: SlotOptions<P>): SlotDefinition<P>;

  of<
    C extends ElementType,
    Multiple extends boolean = false,
    Required extends boolean = false,
  >(
    component: C,
    options?: SlotComponentOptions<C, Multiple, Required>,
  ): SlotDefinition<
    ComponentProps<C>,
    Multiple,
    Required,
    CompoundStaticsOf<C>
  >;
}

export const slot = Object.assign((options: object = {}) => options, {
  of: (component: ElementType, options: object = {}) => ({
    ...options,
    component,
  }),
}) as unknown as SlotFactory;
