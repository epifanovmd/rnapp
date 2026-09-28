import { computed, makeObservable } from "mobx";

import { IHolderError } from "../holder.types";

export interface IHolderLike {
  isLoading: boolean;
  isRefreshing?: boolean;
  isBusy?: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: IHolderError | null;
}

export class CombinedHolder {
  private readonly _holders: IHolderLike[];

  constructor(holders: IHolderLike[]) {
    this._holders = holders;

    makeObservable(this, {
      isLoading: computed,
      isRefreshing: computed,
      isBusy: computed,
      isError: computed,
      isSuccess: computed,
      errors: computed,
      firstError: computed,
    });
  }

  get isLoading(): boolean {
    return this._holders.some(h => h.isLoading);
  }

  get isRefreshing(): boolean {
    return this._holders.some(h => h.isRefreshing ?? false);
  }

  get isBusy(): boolean {
    return this._holders.some(h => h.isBusy ?? h.isLoading);
  }

  get isError(): boolean {
    return this._holders.some(h => h.isError);
  }

  get isSuccess(): boolean {
    return this._holders.every(h => h.isSuccess);
  }

  get errors(): IHolderError[] {
    return this._holders
      .map(h => h.error)
      .filter((e): e is IHolderError => e !== null);
  }

  get firstError(): IHolderError | null {
    return this.errors[0] ?? null;
  }
}
