import { makeAutoObservable } from "mobx";

import { FilterHolder } from "./Filter.holder";
import { TFilterConfig } from "./Filter.types";

export class FiltersHolder<TConfig extends TFilterConfig = TFilterConfig> {
  data: TConfig;

  constructor(config: TConfig) {
    this.data = config;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get filters() {
    return Object.values(this.data) as TConfig[keyof TConfig][];
  }

  public reset() {
    this.filters.forEach(filter => filter.reset());
  }

  public get isEqual() {
    return this.filters.every(filter => filter.isEqual);
  }

  public get isDirty() {
    return !this.isEqual;
  }

  public get filterValue() {
    return Object.keys(this.data).reduce(
      (acc, key) => {
        const k = key as keyof TConfig;

        acc[k] = this.data[k].value;

        return acc;
      },
      {} as {
        [K in keyof TConfig]: TConfig[K]["value"];
      },
    );
  }

  public setValue<K extends keyof TConfig>(
    key: K,
    value: TConfig[K] extends FilterHolder<infer V, any> ? V : never,
  ) {
    this.data[key].setValue(value);
  }

  public resetFilter<K extends keyof TConfig>(
    key: K,
    value?: TConfig[K]["value"],
  ) {
    this.data[key].reset(value);
  }

  public getFilter<K extends keyof TConfig>(key: K): TConfig[K] {
    return this.data[key];
  }
}
