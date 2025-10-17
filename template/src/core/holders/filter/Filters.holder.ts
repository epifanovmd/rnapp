import { makeAutoObservable } from "mobx";

import { FilterHolder, TFilterConfig } from "./Filter.holder";

export class FiltersHolder<TConfig extends TFilterConfig = TFilterConfig> {
  data: TConfig;

  constructor(config: TConfig) {
    this.data = config;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get filters() {
    return Object.values(this.data) as TConfig[keyof TConfig][];
  }

  public get activeFiltersCount() {
    return this.filters.filter(filter => !filter.isEqual).length;
  }

  public get isEqualValueDefault() {
    return this.filters.every(filter => filter.isEqualValueDefault);
  }

  public get isEqual() {
    return this.filters.every(filter => filter.isEqual);
  }

  public get isDirty() {
    return this.filters.some(filter => filter.isDirty);
  }

  public get request() {
    return Object.keys(this.data).reduce(
      (acc, key) => {
        const k = key as keyof TConfig;

        acc[k] = this.data[k].savedValue;

        return acc;
      },
      {} as {
        [K in keyof TConfig]: TConfig[K]["savedValue"];
      },
    );
  }

  public setValue<K extends keyof TConfig>(
    key: K,
    value: TConfig[K] extends FilterHolder<infer V, any> ? V : never,
  ) {
    this.data[key].setValue(value);
  }

  public resetFilterSoft<K extends keyof TConfig>(
    key: K,
    value?: TConfig[K]["value"],
  ) {
    this.data[key].resetSoft(value);
  }

  public resetFilter<K extends keyof TConfig>(
    key: K,
    value?: TConfig[K]["value"],
  ) {
    this.data[key].reset(value);
  }

  public resetSoft() {
    this.filters.forEach(filter => filter.resetSoft());
  }

  public reset() {
    this.filters.forEach(filter => filter.reset());
  }

  public apply() {
    this.filters.forEach(filter => filter.apply());
  }

  public cancel() {
    this.filters.forEach(filter => filter.cancel());
  }

  public cancelExpand() {
    this.filters.forEach(filter => filter.cancelExpand());
  }

  public getFilter<K extends keyof TConfig>(key: K): TConfig[K] {
    return this.data[key];
  }
}
