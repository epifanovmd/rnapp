import { FilterHolder } from "./Filter.holder";

export interface IFilterOption<V> {
  readonly text: string;
  readonly value: V;
}

export interface IFilterItemHolder<
  Value = any,
  Multiple extends boolean = false,
> {
  readonly title: string;
  readonly hint?: string;
  readonly multiple?: Multiple;
  readonly options: IFilterOption<Value>[];
  readonly value?: Multiple extends true ? Value[] : Value;
  readonly defaultValue?: Multiple extends true ? Value[] : Value;
  readonly expandable?: boolean;
  readonly expandCount?: number;
}

export type TFilterConfig = Record<string, FilterHolder<any, boolean>>;

export type TFilterValueType<T> = T extends FilterHolder<infer V, infer M>
  ? M extends true
    ? V[]
    : V
  : never;
