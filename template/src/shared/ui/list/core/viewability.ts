import type { ListMetrics } from "../model";
import type { IListViewabilityPair, IListViewToken } from "../types";

export interface IViewabilityOptions<TItem> {
  metrics: ListMetrics;
  getItem: (index: number) => TItem | undefined;
}

/** Условия одного пересчёта видимости. */
export interface IViewabilityContext {
  scroll: number;
  scrollLength: number;
  startBuffered: number;
  endBuffered: number;
}

/** Состояние одной пары «конфиг + колбэк». */
interface IPairState {
  /** Ключи, о которых колбэк уже уведомлён. */
  viewableKeys: Set<string>;
  /** Ключи, ждущие выдержки `minimumViewTime`. */
  timers: Map<string, ReturnType<typeof setTimeout>>;
}

/**
 * Отслеживание видимости элементов.
 *
 * Порог задаётся либо долей самого элемента (`itemVisiblePercentThreshold`),
 * либо долей вьюпорта, которую он занимает (`viewAreaCoveragePercentThreshold`) —
 * для крупных элементов, не помещающихся в экран целиком, работает только второй.
 *
 * `minimumViewTime` откладывает уведомление: элемент, мелькнувший при быстром
 * скролле, видимым не считается. Если он успел уйти до истечения выдержки,
 * таймер снимается и колбэк не вызывается.
 */
export class ViewabilityTracker<TItem> {
  private readonly options: IViewabilityOptions<TItem>;

  private pairs: IListViewabilityPair<TItem>[] = [];
  private states = new Map<IListViewabilityPair<TItem>, IPairState>();

  constructor(options: IViewabilityOptions<TItem>) {
    this.options = options;
  }

  setPairs(pairs: IListViewabilityPair<TItem>[] | undefined): void {
    const next = pairs ?? [];

    for (const pair of this.pairs) {
      if (next.includes(pair)) continue;

      this.clearTimers(pair);
      this.states.delete(pair);
    }

    this.pairs = next;
  }

  hasPairs(): boolean {
    return this.pairs.length > 0;
  }

  private getState(pair: IListViewabilityPair<TItem>): IPairState {
    let state = this.states.get(pair);

    if (!state) {
      state = { viewableKeys: new Set(), timers: new Map() };
      this.states.set(pair, state);
    }

    return state;
  }

  private clearTimers(pair: IListViewabilityPair<TItem>): void {
    const state = this.states.get(pair);

    if (!state) return;

    for (const timer of state.timers.values()) clearTimeout(timer);

    state.timers.clear();
  }

  /** Пересчитать видимость и уведомить изменившиеся пары. */
  update(context: IViewabilityContext): void {
    for (const pair of this.pairs) {
      this.updatePair(pair, context);
    }
  }

  private updatePair(
    pair: IListViewabilityPair<TItem>,
    context: IViewabilityContext,
  ): void {
    const state = this.getState(pair);
    const { minimumViewTime } = pair.config;
    const nowViewable = this.collectViewableKeys(pair, context);

    const entered = [...nowViewable].filter(
      key => !state.viewableKeys.has(key),
    );
    const exited = [...state.viewableKeys].filter(key => !nowViewable.has(key));

    // Элемент ушёл раньше выдержки — уведомления о нём не будет. Проверяются
    // именно ожидающие таймеры: о таком элементе ещё никто не знает, поэтому в
    // списке уже видимых его нет.
    for (const [key, timer] of state.timers) {
      if (nowViewable.has(key)) continue;

      clearTimeout(timer);
      state.timers.delete(key);
    }

    if (!minimumViewTime) {
      this.commit(pair, state, entered, exited);

      return;
    }

    for (const key of entered) {
      if (state.timers.has(key)) continue;

      const timer = setTimeout(() => {
        state.timers.delete(key);
        this.commit(pair, state, [key], []);
      }, minimumViewTime);

      state.timers.set(key, timer);
    }

    this.commit(pair, state, [], exited);
  }

  private collectViewableKeys(
    pair: IListViewabilityPair<TItem>,
    context: IViewabilityContext,
  ): Set<string> {
    const { metrics } = this.options;
    const { scroll, scrollLength, startBuffered, endBuffered } = context;
    const { itemVisiblePercentThreshold, viewAreaCoveragePercentThreshold } =
      pair.config;
    const viewable = new Set<string>();

    for (let index = startBuffered; index <= endBuffered; index++) {
      const key = metrics.getKey(index);

      if (key === undefined) continue;

      const position = metrics.getPosition(index);
      const size = metrics.getSize(index);
      const visible =
        Math.min(position + size, scroll + scrollLength) -
        Math.max(position, scroll);

      if (visible <= 0) continue;

      const byItem = size > 0 ? (visible / size) * 100 : 0;
      const byViewport = scrollLength > 0 ? (visible / scrollLength) * 100 : 0;

      const isViewable =
        viewAreaCoveragePercentThreshold !== undefined
          ? byViewport >= viewAreaCoveragePercentThreshold
          : byItem >= (itemVisiblePercentThreshold ?? 0);

      if (isViewable) viewable.add(key);
    }

    return viewable;
  }

  private commit(
    pair: IListViewabilityPair<TItem>,
    state: IPairState,
    entered: string[],
    exited: string[],
  ): void {
    if (entered.length === 0 && exited.length === 0) return;

    for (const key of entered) state.viewableKeys.add(key);
    for (const key of exited) state.viewableKeys.delete(key);

    const changed: IListViewToken<TItem>[] = [
      ...entered.map(key => this.createToken(key, true)),
      ...exited.map(key => this.createToken(key, false)),
    ].filter((token): token is IListViewToken<TItem> => token !== undefined);

    const viewableItems = [...state.viewableKeys]
      .map(key => this.createToken(key, true))
      .filter((token): token is IListViewToken<TItem> => token !== undefined);

    pair.onViewableItemsChanged({ viewableItems, changed });
  }

  private createToken(
    key: string,
    isViewable: boolean,
  ): IListViewToken<TItem> | undefined {
    const index = this.options.metrics.getIndexByKey(key);

    if (index === undefined) return undefined;

    const item = this.options.getItem(index);

    if (item === undefined) return undefined;

    return { item, key, index, isViewable };
  }

  dispose(): void {
    for (const pair of this.pairs) this.clearTimers(pair);

    this.states.clear();
  }
}
