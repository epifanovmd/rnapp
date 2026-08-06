import type { FC, Key, PropsWithChildren, ReactNode } from "react";
import React from "react";

import type {
  AnySlotDefinition,
  RenderSlotOptions,
  ResolvedMultipleSlot,
  ResolvedSingleSlot,
  ResolvedSlots,
  SlotSchema,
} from "./slot.types";

export const SLOT_META = Symbol("slot-meta");
export const COMPOUND_META = Symbol("compound-meta");

export type AnyProps = Record<string, unknown>;

/** Значение слота: props элемента и его key (нужен multiple-слотам). */
export interface SlotValue {
  key?: Key | null;
  props: AnyProps;
}

/**
 * Слот схемы, подготовленный один раз при создании компонента: флаги и хендл
 * пустого слота не пересчитываются на каждый рендер.
 */
export interface SlotEntry {
  definition: AnySlotDefinition;
  empty: ResolvedMultipleSlot<any> | ResolvedSingleSlot<any>;
  key: string;
  multiple: boolean;
  name: string;
}

export interface SlotMeta {
  entry: SlotEntry;
  owner: symbol;
  ownerName: string;
}

export interface CompoundMeta {
  name: string;
  owner: symbol;
}

export type SlotMarker = FC<any> & { [SLOT_META]: SlotMeta };
export type Tagged = {
  [SLOT_META]?: SlotMeta;
  [COMPOUND_META]?: CompoundMeta;
};

export type SlotValues = Record<string, SlotValue | SlotValue[] | undefined>;

/** Результат стратегии разбора: контент + сырые значения слотов. */
export interface SlotResolution {
  contentItems: ReactNode[];
  values: SlotValues;
}

const EMPTY_ITEMS: readonly SlotValue[] = Object.freeze([]);

// `typeof` — модуль поднимается и вне RN-рантайма (тесты на node).
const isDev = () => typeof __DEV__ !== "undefined" && __DEV__;

/**
 * Fast Refresh переисполняет модуль компонента и создаёт новый owner-символ,
 * тогда как элементы в дереве остаются со старым. В dev владелец дополнительно
 * сверяется по имени, в prod сравниваются только символы.
 */
export const isSameOwner = (owner: symbol, ownerName: string, meta: SlotMeta) =>
  meta.owner === owner || (isDev() && meta.ownerName === ownerName);

/**
 * Слот текущей схемы для маркера. После Fast Refresh запись в метаданных
 * маркера устаревает, поэтому она доискивается по ключу. `undefined` — слот
 * чужого компонента.
 */
export const matchSlotEntry = (
  meta: SlotMeta,
  owner: symbol,
  ownerName: string,
  entries: readonly SlotEntry[],
): SlotEntry | undefined => {
  if (meta.owner === owner) {
    return meta.entry;
  }

  return isSameOwner(owner, ownerName, meta)
    ? entries.find(entry => entry.key === meta.entry.key)
    : undefined;
};

/** Готовые политики слияния props слота. */
export const mergeSlotProps = {
  shallow<P extends object>(
    defaults: Partial<PropsWithChildren<P>>,
    props: PropsWithChildren<P>,
  ): PropsWithChildren<P> {
    return { ...defaults, ...props } as PropsWithChildren<P>;
  },

  reactNative<P extends { style?: unknown }>(
    defaults: Partial<PropsWithChildren<P>>,
    props: PropsWithChildren<P>,
  ): PropsWithChildren<P> {
    const merged = { ...defaults, ...props } as PropsWithChildren<P>;

    if (defaults.style !== undefined) {
      merged.style = (
        props.style === undefined
          ? defaults.style
          : [defaults.style, props.style]
      ) as P["style"];
    }

    return merged;
  },

  composeHandlers<Args extends unknown[]>(
    first?: (...args: Args) => void,
    second?: (...args: Args) => void,
  ) {
    if (!first || !second) {
      return first ?? second;
    }

    return (...args: Args) => {
      first(...args);
      second(...args);
    };
  },
};

/**
 * Обход детей вместо `React.Children.forEach`: тот аллоцирует массив
 * результата и строит строковые ключи на каждого ребёнка. Пустые узлы
 * (`null`/`undefined`/`boolean`) отбрасываются, а не превращаются в `null`.
 */
export const eachChild = (
  nodes: ReactNode,
  visit: (node: ReactNode) => void,
) => {
  if (nodes === null || nodes === undefined || typeof nodes === "boolean") {
    return;
  }

  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      eachChild(node, visit);
    }

    return;
  }

  if (typeof nodes === "object" && Symbol.iterator in nodes) {
    for (const node of nodes as Iterable<ReactNode>) {
      eachChild(node, visit);
    }

    return;
  }

  visit(nodes);
};

const renderSlot = (
  definition: AnySlotDefinition,
  value: SlotValue,
  options?: RenderSlotOptions<any>,
  fallbackKey?: Key,
): ReactNode => {
  const { component, defaultProps, mergeProps } = definition;
  const optionDefaults = options?.defaultProps as AnyProps | undefined;
  let props = value.props;

  if (mergeProps || defaultProps || optionDefaults) {
    const merge = mergeProps ?? mergeSlotProps.shallow;

    props = merge(merge(defaultProps ?? {}, optionDefaults ?? {}), props);
  }

  if (!component) {
    return (props as PropsWithChildren<AnyProps>).children ?? null;
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
  private readonly definition: AnySlotDefinition;
  private readonly value?: SlotValue;

  constructor(definition: AnySlotDefinition, value?: SlotValue) {
    this.definition = definition;
    this.value = value;
    this.present = value !== undefined;
    this.props = value?.props;
  }

  render(options?: RenderSlotOptions<any>): ReactNode {
    return this.value
      ? renderSlot(this.definition, this.value, options)
      : (options?.fallback ?? null);
  }
}

class MultipleSlot implements ResolvedMultipleSlot<any> {
  readonly present: boolean;
  readonly items: readonly SlotValue[];
  private readonly definition: AnySlotDefinition;

  constructor(
    definition: AnySlotDefinition,
    items: readonly SlotValue[] = EMPTY_ITEMS,
  ) {
    this.definition = definition;
    this.items = items;
    this.present = items.length > 0;
  }

  renderAll(
    options?: RenderSlotOptions<any> & { separator?: ReactNode },
  ): ReactNode {
    const { definition, items } = this;
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

      nodes.push(renderSlot(definition, item, options, item.key ?? index));
    }

    return nodes;
  }
}

const capitalize = (value: string) =>
  value.length ? value[0].toUpperCase() + value.slice(1) : value;

/** Разворачивает схему в записи с готовым хендлом пустого слота. */
export const createSlotEntries = (schema: SlotSchema): SlotEntry[] =>
  Object.entries(schema).map(([key, definition]) => {
    const multiple = definition.multiple === true;

    return {
      definition,
      empty: multiple
        ? new MultipleSlot(definition)
        : new SingleSlot(definition),
      key,
      multiple,
      name: capitalize(key),
    };
  });

/**
 * Собирает хендлы слотов: для отсутствующих переиспользуется общий пустой
 * хендл, он же служит признаком незаполненного обязательного слота.
 */
export const resolveHandles = <S extends SlotSchema>(
  ownerName: string,
  entries: readonly SlotEntry[],
  values: SlotValues,
): ResolvedSlots<S> => {
  const resolved: Record<string, unknown> = {};

  for (const entry of entries) {
    const value = values[entry.key];
    let handle = entry.empty;

    if (!entry.multiple) {
      if (value !== undefined) {
        handle = new SingleSlot(entry.definition, value as SlotValue);
      }
    } else if (value !== undefined && (value as SlotValue[]).length > 0) {
      handle = new MultipleSlot(entry.definition, value as SlotValue[]);
    }

    if (handle === entry.empty && entry.definition.required) {
      throw new Error(`${ownerName}: required slot "${entry.key}" is missing.`);
    }

    resolved[entry.key] = handle;
  }

  return resolved as ResolvedSlots<S>;
};
