import {
  type ICacheProvider,
  type ICacheState,
} from "../cached-cursor-holder.types";

export interface CursorTestItem {
  id: string;
  rank: number;
}

export const cursorItem = (
  rank: number,
  id = String(rank),
): CursorTestItem => ({ id, rank });

export const cursorOptions = {
  keyExtractor: (value: CursorTestItem) => value.id,
  idExtractor: (value: CursorTestItem) => value.id,
  sort: (left: CursorTestItem, right: CursorTestItem) => left.rank - right.rank,
  initialLimit: 3,
  pageLimit: 2,
};

export class MemoryCache<T> implements ICacheProvider<T> {
  state = new Map<string, ICacheState<T>>();
  scheduled: { key: string; getState: () => ICacheState<T> } | null = null;
  cancelCount = 0;

  read(key: string) {
    return this.state.get(key) ?? null;
  }

  schedulePersist(key: string, getState: () => ICacheState<T>) {
    this.scheduled = { key, getState };
  }

  persistNow(key: string, state: ICacheState<T>) {
    this.state.set(key, state);
  }

  cancelPersist() {
    this.cancelCount++;
  }
}
