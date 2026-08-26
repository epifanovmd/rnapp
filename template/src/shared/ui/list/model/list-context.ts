import { createContext, useContext } from "react";
import type { SharedValue } from "react-native-reanimated";

import type { IListStickyConfig } from "../types";
import type { ListStore } from "./list-store";

/** Расчётное ядро, доступное дереву списка. Тип элемента здесь не важен. */
export interface IListRuntimeHandle {
  getItemAt: (index: number) => unknown;
  setItemSize: (key: string, size: number) => void;
}

export interface IListContextValue {
  store: ListStore;
  runtime: IListRuntimeHandle;
  /** Смещение скролла на UI-потоке — прилипание считается из него. */
  scrollOffset: SharedValue<number>;
  sticky: IListStickyConfig[];
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
