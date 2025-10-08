export interface IFilterOption<V> {
  readonly text: string;
  readonly value: V;
}

export type TFilterMultipleType<Value, Multiple> = Multiple extends true
  ? Value[]
  : Value;

export type TFilterValueType<Value, Default, Multiple> = Default extends Value
  ? TFilterMultipleType<Value, Multiple>
  : TFilterMultipleType<Value, Multiple> | undefined;

export interface IFilterItemHolder<
  Value = any,
  Default extends Value | undefined = undefined,
  Multiple extends boolean = false,
> {
  readonly title: string;
  readonly hint?: string;
  readonly multiple?: Multiple;
  readonly options: IFilterOption<Value>[];
  readonly defaultValue?: TFilterMultipleType<Default, Multiple>;
  readonly value?: TFilterValueType<Value, Default, Multiple>;
  readonly expandable?: boolean;
  readonly expandCount?: number;
}
