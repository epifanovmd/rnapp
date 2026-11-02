import type { Key } from "react";

import type {
  AnySlotDefinition,
  ResolvedMultipleSlot,
  ResolvedSingleSlot,
} from "./slot.types";

export const SLOT_META = Symbol("slot-meta");
export const COMPOUND_META = Symbol("compound-meta");

export type AnyProps = Record<string, any>;

/** Значение слота: props элемента и его key (нужен multiple-слотам). */
export interface SlotValue {
  key?: Key | null;
  props: AnyProps;
}

export type SlotValues = Record<string, SlotValue | SlotValue[] | undefined>;

export type SlotMergeFn = (props: AnyProps, inject: AnyProps) => AnyProps;

/**
 * Слот схемы, подготовленный один раз при создании компонента: флаги, политика
 * слияния и хендл пустого слота не пересчитываются на каждый рендер.
 */
export interface SlotEntry {
  definition: AnySlotDefinition;
  empty: ResolvedMultipleSlot<any> | ResolvedSingleSlot<any>;
  key: string;
  merge: SlotMergeFn;
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
  statics: Record<string, unknown>;
}

export type Tagged = {
  [SLOT_META]?: SlotMeta;
  [COMPOUND_META]?: CompoundMeta;
};

/** Контекст разбора: всё, что стратегии знают о владельце. */
export interface ResolveContext {
  entries: readonly SlotEntry[];
  owner: symbol;
  ownerName: string;
}

// `typeof` — модуль поднимается и вне RN-рантайма (тесты на node).
export const isDev = () => typeof __DEV__ !== "undefined" && __DEV__;

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
  { entries, owner, ownerName }: ResolveContext,
): SlotEntry | undefined => {
  if (meta.owner === owner) {
    return meta.entry;
  }

  return isSameOwner(owner, ownerName, meta)
    ? entries.find(entry => entry.key === meta.entry.key)
    : undefined;
};
