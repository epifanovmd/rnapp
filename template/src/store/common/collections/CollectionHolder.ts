import {makeAutoObservable} from 'mobx';
import {debounce} from 'lodash';

export enum CollectionLoadState {
  ready = 'ready',
  loading = 'loading',
  pullToRefreshing = 'pullToRefreshing',
  loadingMore = 'loadingMore',
  error = 'error',
}

interface Range {
  index: number;
  count: number;
}

interface IDataHolderError {
  type?: string;
  code?: string;
  msg: string;
}

interface Options {
  pageSize?: number;
}

type Collection<T> = T[];

export class CollectionHolder<T> {
  public error?: IDataHolderError;
  public d: Collection<T> = [];
  private _visibleRange: Range = {
    index: 0,
    count: 0,
  };
  private _state: CollectionLoadState = CollectionLoadState.ready;
  private _lastDataLength: number = 0;
  private readonly _pageSize: number;

  constructor(data?: Collection<T>, opts?: Options) {
    const op = opts || {};

    this._pageSize = op.pageSize || 10000;

    if (data) {
      this.setData(data);
    }

    this.performChangeVisibleRange = debounce(
      this.performChangeVisibleRange,
      200,
    );
    makeAutoObservable(this, {}, {autoBind: true});
  }

  private _isLoadedFirst: boolean = false;

  public get isLoadedFirst() {
    return this._isLoadedFirst;
  }

  public get offset(): number | undefined {
    return this.isLoadingMore ? this.d.length : this._visibleRange.index;
  }

  public get pageCount(): number | undefined {
    return this._visibleRange.count || undefined;
  }

  public get pageSize(): number {
    return this._pageSize;
  }

  public get isLoadingAllowed(): boolean {
    return (
      this._state === CollectionLoadState.ready ||
      this._state === CollectionLoadState.error
    );
  }

  public get isLoading() {
    return this._state === CollectionLoadState.loading;
  }

  /* loading */

  public get isPullToRefreshAllowed(): boolean {
    return (
      this._state === CollectionLoadState.ready ||
      this._state === CollectionLoadState.error
    );
  }

  public get isPullToRefreshing() {
    return this._state === CollectionLoadState.pullToRefreshing;
  }

  public get isLoadingMoreAllowed(): boolean {
    const isEndReached = this._lastDataLength < this._pageSize;

    return (
      (this._state === CollectionLoadState.ready ||
        this._state === CollectionLoadState.error) &&
      !isEndReached
    );
  }

  public get isLoadingMore() {
    return this._state === CollectionLoadState.loadingMore;
  }

  /* PullToRefresh */

  public get isReady() {
    return this._state === CollectionLoadState.ready;
  }

  public get isError() {
    return this._state === CollectionLoadState.error;
  }

  public get isEmpty() {
    return !this.d.length;
  }

  /* loadingMore */

  public setData(data: Collection<T>) {
    switch (this._state) {
      case CollectionLoadState.loadingMore:
        this.d = [...this.d, ...data];
        break;
      case CollectionLoadState.ready:
      case CollectionLoadState.loading:
      case CollectionLoadState.pullToRefreshing:
      default:
        this.d = data;
        break;
    }

    this._lastDataLength = data.length;
    this._setState(CollectionLoadState.ready);
    if (!this._isLoadedFirst) {
      this._setIsLoadedFirst(true);
    }

    return this;
  }

  public setError(error: IDataHolderError) {
    this.d = [];
    this.error = error;
    this._setState(CollectionLoadState.error);
    this._setIsLoadedFirst(false);

    return this;
  }

  public setLoading() {
    this.d = [];
    this._setState(CollectionLoadState.loading);
    this._setIsLoadedFirst(false);

    return this;
  }

  /* Ready */

  public setReady() {
    this._setState(CollectionLoadState.ready);

    return this;
  }

  public setPullToRefreshing() {
    this._setState(CollectionLoadState.pullToRefreshing);

    return this;
  }

  public setLoadingMore() {
    this._setState(CollectionLoadState.loadingMore);

    return this;
  }

  public performChangeVisibleRange(index: number, count: number): void {
    this._visibleRange.index = index;
    this._visibleRange.count = count;
  }

  private _setState(state: CollectionLoadState) {
    this._state = state;
  }

  private _setIsLoadedFirst(value: boolean) {
    this._isLoadedFirst = value;
  }
}
