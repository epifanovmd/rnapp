import { action, makeObservable } from "mobx";

import { BaseListHolder } from "../base/base-list-holder";
import {
  CollectionFetchFn,
  HolderStatus,
  IApiResponse,
  IHolderError,
} from "../holder.types";

export interface ICollectionHolderOptions<TItem, TArgs = void> {
  onFetch?: CollectionFetchFn<TItem, TArgs>;
  keyExtractor?: (item: TItem) => string | number;
}

export interface ICollectionHolderResult<TItem, TError extends IHolderError> {
  data: TItem[] | null;
  error: TError | null;
}

export class CollectionHolder<
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
> extends BaseListHolder<TItem, TError> {
  private readonly _onFetch?: CollectionFetchFn<TItem, TArgs>;

  constructor(options?: ICollectionHolderOptions<TItem, TArgs>) {
    super(options?.keyExtractor);

    makeObservable(this, {
      setItems: action,
      reset: action,
    });

    this._onFetch = options?.onFetch;
  }

  setItems(items: TItem[]) {
    this.items = items;
    this.status = HolderStatus.Success;
    this.error = null;
  }

  reset() {
    this.items = [];
    this.status = HolderStatus.Idle;
    this.error = null;
  }

  prependItem(item: TItem) {
    this.items = [item, ...this.items];
  }

  appendItem(item: TItem) {
    this.items = [...this.items, item];
  }

  removeItem(predicate: ((item: TItem) => boolean) | string | number) {
    const fn = this._normalizePredicate(predicate);

    this.items = this.items.filter(item => !fn(item));
  }

  async fromApi<TResponse = TItem[], TApiError extends IHolderError = TError>(
    fn: () => Promise<IApiResponse<TResponse, TApiError>>,
    extractor?: (response: TResponse) => TItem[],
    options?: { refresh?: boolean },
  ): Promise<ICollectionHolderResult<TItem, TApiError>> {
    return this._fetch(fn, extractor, options?.refresh ?? false);
  }

  async load(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<ICollectionHolderResult<TItem, TError>> {
    return this._runFetch(_args[0] as TArgs, false);
  }

  async refresh(
    ..._args: TArgs extends void ? [] : [args: TArgs]
  ): Promise<ICollectionHolderResult<TItem, TError>> {
    return this._runFetch(_args[0] as TArgs, true);
  }

  private async _runFetch(
    args: TArgs,
    isRefresh: boolean,
  ): Promise<ICollectionHolderResult<TItem, TError>> {
    if (!this._onFetch) {
      console.warn(
        "[CollectionHolder] load/refresh called but no onFetch was provided in options.",
      );

      return { data: null, error: null };
    }

    const onFetch = this._onFetch;

    return this._fetch(
      () => onFetch(args) as Promise<IApiResponse<TItem[], TError>>,
      undefined,
      isRefresh,
    );
  }

  private _fetch<TResponse, TApiError extends IHolderError>(
    fn: () => Promise<IApiResponse<TResponse, TApiError>>,
    extractor: ((response: TResponse) => TItem[]) | undefined,
    isRefresh: boolean,
  ): Promise<ICollectionHolderResult<TItem, TApiError>> {
    return this._request<
      TResponse,
      TApiError,
      ICollectionHolderResult<TItem, TApiError>
    >(fn, {
      onStart: () => (isRefresh ? this.setRefreshing() : this.setLoading()),
      onSuccess: data => {
        const items =
          data == null
            ? []
            : extractor
              ? extractor(data)
              : (data as unknown as TItem[]);

        this.setItems(items);

        return { data: items, error: null };
      },
      onError: error => {
        this.setError(error as unknown as TError);

        return { data: null, error };
      },
      onCancel: () => this._restoreStatus(this.items.length > 0),
      skipped: () => ({ data: null, error: null }),
    });
  }
}
