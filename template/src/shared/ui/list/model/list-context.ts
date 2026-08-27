import { createContext, useContext } from "react";
import type { SharedValue } from "react-native-reanimated";

import type { IListStickyConfig } from "../types";
import type { ListStore } from "./list-store";

/** Расчётное ядро, доступное дереву списка. Тип элемента здесь не важен. */
export interface IListRuntimeHandle {
  getItemAt: (index: number) => unknown;
  setItemSize: (key: string, size: number) => void;
  /** Принять замер, только пока контейнер всё ещё рисует указанный ключ. */
  setContainerItemSize: (id: number, key: string, size: number) => void;
  /** Фиксированный размер не требует `onLayout` и повторных измерений. */
  isItemSizeFixed: (key: string) => boolean;
  /** Перерабатывать нативное поддерево ячейки между элементами одного типа. */
  shouldRecycleItems: () => boolean;
  /** Геометрия якоря в координатах элементов; undefined — индекса нет. */
  getStickyGeometry: (index: number) => IListStickyGeometry | undefined;
}

/** Что нужно знать о якоре слою прилипших копий. */
export interface IListStickyGeometry {
  position: number;
  size: number;
  /** Предел смещения; см. `getStickyLimitOf`. */
  limit: number | undefined;
}

export interface IListContextValue {
  store: ListStore;
  runtime: IListRuntimeHandle;
  /** Смещение скролла на UI-потоке — прилипание считается из него. */
  scrollOffset: SharedValue<number>;
  sticky: IListStickyConfig[];
  /** Якоря, уже отрисованные слоем прилипших копий. */
  stickyPinned: IListStickyPinnedIndices;
}

/**
 * Индекс якоря, который слой действительно нарисовал, по кромкам.
 *
 * Зачем нужен: копия внутри контента обязана прятаться не тогда, когда якорь
 * доехал до кромки, а тогда, когда его уже рисует слой. Слой узнаёт о новом
 * якоре из рендера, то есть на коммит позже, и без этой сверки на стыке
 * оставался бы кадр, где не нарисован ни один из двух.
 */
export interface IListStickyPinnedIndices {
  start: SharedValue<number>;
  end: SharedValue<number>;
}

const ListContext = createContext<IListContextValue | null>(null);

export const ListContextProvider = ListContext.Provider;

const useListContext = (): IListContextValue => {
  const value = useContext(ListContext);

  if (!value) {
    throw new Error("useListContext: компонент отрисован вне списка");
  }

  return value;
};

export const useListStore = (): ListStore => useListContext().store;

export const useListRuntime = (): IListRuntimeHandle =>
  useListContext().runtime;

export const useListScrollOffset = (): SharedValue<number> =>
  useListContext().scrollOffset;

/** Наборы прилипающих элементов, объявленные списком. */
export const useListSticky = (): IListStickyConfig[] => useListContext().sticky;

/** Якоря, уже отрисованные слоем прилипших копий; см. {@link IListStickyPinnedIndices}. */
export const useListStickyPinned = (): IListStickyPinnedIndices =>
  useListContext().stickyPinned;
