import { ICursorHolderOptions } from "./cursor-holder";

export interface ICacheState<TItem> {
  items: TItem[];
  hasMore: boolean;
  hasNewer: boolean;
}

export interface ICacheProvider<TItem> {
  read(key: string): ICacheState<TItem> | null;

  schedulePersist(key: string, getState: () => ICacheState<TItem>): void;

  persistNow(key: string, state: ICacheState<TItem>): void;

  cancelPersist(): void;
}

export interface IFetchProvider<TItem> {
  fetch(params: {
    key: string;
    before?: string;
    after?: string;
    around?: string;
    limit: number;
  }): Promise<{ data: TItem[]; hasMore: boolean; hasNewer: boolean } | null>;
}

export interface ICacheAnchor {
  id: string;
  wasAtBottom: boolean;
}

export interface ICachedCursorHolderOptions<
  TItem,
> extends ICursorHolderOptions<TItem> {
  idExtractor: (item: TItem) => string;
  sort: (a: TItem, b: TItem) => number;
}

export interface ISyncCursorHolderOptions<
  TItem,
> extends ICachedCursorHolderOptions<TItem> {
  initialLimit?: number;
  pageLimit?: number;
}
