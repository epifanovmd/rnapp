import { action, computed, makeObservable, observable } from "mobx";

import { IHolderError } from "../holder.types";
import { BaseHolder } from "./base-holder";

export abstract class BaseListHolder<
  TItem,
  TError extends IHolderError = IHolderError,
> extends BaseHolder<TError> {
  items: TItem[] = [];

  protected readonly _keyExtractor?: (item: TItem) => string | number;

  constructor(keyExtractor?: (item: TItem) => string | number) {
    super();
    this._keyExtractor = keyExtractor;

    makeObservable(this, {
      items: observable,

      isEmpty: computed,
      count: computed,

      updateItem: action,
      updateItems: action,
      upsertItem: action,
    });
  }

  get isEmpty() {
    return this.isSuccess && this.items.length === 0;
  }

  get count() {
    return this.items.length;
  }

  abstract prependItem(item: TItem): void;
  abstract appendItem(item: TItem): void;
  abstract removeItem(
    predicate: ((item: TItem) => boolean) | string | number,
  ): void;

  updateItem(
    predicate: ((item: TItem) => boolean) | string | number,
    updated: TItem,
  ) {
    const fn = this._normalizePredicate(predicate);

    this.items = this.items.map(item => (fn(item) ? updated : item));
  }

  /**
   * Обновление многих элементов одним действием: `updater` возвращает новый
   * элемент или тот же, если менять нечего. Массив заменяется, только если
   * изменился хотя бы один элемент, — наблюдатели перерисуются один раз.
   */
  updateItems(updater: (item: TItem) => TItem) {
    let changed = false;
    const next = this.items.map(item => {
      const updated = updater(item);

      if (updated !== item) changed = true;

      return updated;
    });

    if (changed) this.items = next;
  }

  upsertItem(
    predicate: ((item: TItem) => boolean) | string | number,
    item: TItem,
  ) {
    const fn = this._normalizePredicate(predicate);

    if (this.items.some(fn)) {
      this.items = this.items.map(i => (fn(i) ? item : i));
    } else {
      this.appendItem(item);
    }
  }

  appendIfNotExists(
    predicate: ((item: TItem) => boolean) | string | number,
    item: TItem,
  ) {
    if (!this.exists(predicate)) {
      this.appendItem(item);
    }
  }

  prependIfNotExists(
    predicate: ((item: TItem) => boolean) | string | number,
    item: TItem,
  ) {
    if (!this.exists(predicate)) {
      this.prependItem(item);
    }
  }

  exists(predicate: ((item: TItem) => boolean) | string | number) {
    const fn = this._normalizePredicate(predicate);

    return this.items.some(fn);
  }

  get(predicate: ((item: TItem) => boolean) | string | number) {
    const fn = this._normalizePredicate(predicate);

    return this.items.find(fn);
  }

  protected _normalizePredicate(
    predicate: ((item: TItem) => boolean) | string | number,
  ): (item: TItem) => boolean {
    if (typeof predicate === "function") return predicate;
    if (!this._keyExtractor) {
      throw new Error(
        `[${this.constructor.name}] keyExtractor must be configured to use string/number predicates.`,
      );
    }
    const key = predicate;

    return item => this._keyExtractor!(item) === key;
  }
}
