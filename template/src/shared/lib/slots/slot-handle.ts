import type { Key, ReactNode } from "react";
import React from "react";

import type {
  RenderSlotOptions,
  ResolvedMultipleSlot,
  ResolvedSingleSlot,
  ResolvedSlots,
  SlotSchema,
} from "./slot.types";
import type { AnyProps, SlotEntry, SlotValue, SlotValues } from "./slot-meta";

const EMPTY_VALUE: SlotValue = { props: {} };
const EMPTY_ITEMS: readonly SlotValue[] = Object.freeze([]);

/**
 * Свёртка props слота политикой слияния: `defaultProps` схемы → `defaults`
 * вызова → props потребителя → `inject` владельца. Каждый следующий слой
 * приоритетнее предыдущего, `style` и `on*` при этом не теряются.
 */
const renderValue = (
  entry: SlotEntry,
  value: SlotValue,
  options?: RenderSlotOptions<any>,
  fallbackKey?: Key,
): ReactNode => {
  const { component, defaultProps } = entry.definition;
  const defaults = options?.defaults as AnyProps | undefined;
  let props = value.props;

  if (defaultProps || defaults) {
    const base =
      defaultProps && defaults
        ? entry.merge(defaultProps as AnyProps, defaults)
        : ((defaults ?? defaultProps) as AnyProps);

    props = entry.merge(base, props);
  }

  if (options?.inject) {
    props = entry.merge(props, options.inject as AnyProps);
  }

  const { children } = props;

  if (typeof children === "function") {
    const { children: _render, ...rest } = props;

    return children(rest);
  }

  if (!component) {
    return (children as ReactNode) ?? null;
  }

  const key = value.key ?? fallbackKey;

  return React.createElement(
    component,
    key === null || key === undefined ? props : { ...props, key },
  );
};

class SingleSlot implements ResolvedSingleSlot<any> {
  readonly present: boolean;
  readonly props: AnyProps | undefined;
  private readonly entry: SlotEntry;
  private readonly value?: SlotValue;

  constructor(entry: SlotEntry, value?: SlotValue) {
    this.entry = entry;
    this.value = value;
    this.present = value !== undefined;
    this.props = value?.props;
  }

  render(options?: RenderSlotOptions<any>): ReactNode {
    if (this.value) {
      return renderValue(this.entry, this.value, options);
    }

    return this.entry.definition.always
      ? renderValue(this.entry, EMPTY_VALUE, options)
      : (options?.fallback ?? null);
  }
}

class MultipleSlot implements ResolvedMultipleSlot<any> {
  readonly present: boolean;
  readonly items: readonly SlotValue[];
  private readonly entry: SlotEntry;

  constructor(entry: SlotEntry, items: readonly SlotValue[] = EMPTY_ITEMS) {
    this.entry = entry;
    this.items = items;
    this.present = items.length > 0;
  }

  renderAll(
    options?: RenderSlotOptions<any> & { separator?: ReactNode },
  ): ReactNode {
    const { entry, items } = this;

    if (items.length === 0) {
      return options?.fallback ?? null;
    }

    const separator = options?.separator;
    const nodes: ReactNode[] = [];

    for (let index = 0; index < items.length; index++) {
      const item = items[index];

      if (index > 0 && separator !== undefined) {
        nodes.push(
          React.createElement(
            React.Fragment,
            { key: `separator-${index}` },
            separator,
          ),
        );
      }

      nodes.push(renderValue(entry, item, options, item.key ?? index));
    }

    return nodes;
  }
}

export const createEmptyHandle = (entry: SlotEntry) =>
  entry.multiple ? new MultipleSlot(entry) : new SingleSlot(entry);

/**
 * Хендлы слотов: значения из детей приоритетнее значений из prop `slots`, для
 * отсутствующих переиспользуется общий пустой хендл схемы.
 */
export const resolveHandles = <S extends SlotSchema>(
  entries: readonly SlotEntry[],
  values: SlotValues,
  objectValues?: SlotValues,
): ResolvedSlots<S> => {
  const resolved: Record<string, unknown> = {};

  for (const entry of entries) {
    const value = values[entry.key] ?? objectValues?.[entry.key];

    if (value === undefined) {
      resolved[entry.key] = entry.empty;
    } else if (entry.multiple) {
      const items = value as SlotValue[];

      resolved[entry.key] =
        items.length > 0 ? new MultipleSlot(entry, items) : entry.empty;
    } else {
      resolved[entry.key] = new SingleSlot(entry, value as SlotValue);
    }
  }

  return resolved as ResolvedSlots<S>;
};
