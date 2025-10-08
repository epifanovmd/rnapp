import { isEqual } from "lodash";
import { makeAutoObservable } from "mobx";

import { IFilterItemHolder, IFilterOption } from "./Filter.types";

export class FilterHolder<Value = any, Multiple extends boolean = false>
  implements IFilterItemHolder<Value, Multiple>
{
  public readonly title: string;
  public readonly hint?: string;
  public readonly multiple?: Multiple;
  public defaultValue?: Multiple extends true ? Value[] : Value;
  public value?: Multiple extends true ? Value[] : Value;
  public savedValue?: Multiple extends true ? Value[] : Value;
  public readonly expandable?: boolean;
  public readonly expandCount?: number;
  public expanded: boolean = true;

  private readonly _options: IFilterOption<Value>[];

  constructor(data: IFilterItemHolder<Value, Multiple>) {
    this.title = data.title;
    this.hint = data.hint;
    this.multiple = data.multiple;
    this.defaultValue = data.defaultValue;
    this.value = data.value ?? data.defaultValue;
    this.savedValue = data.value;
    this.expandable = data.expandable;
    this.expandCount = data.expandCount;
    this.expanded = !(data.expandable && data.expandCount);

    this._options = data.options;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get isEqual() {
    return isEqual(this.value, this.defaultValue);
  }

  public get isDirty() {
    return !isEqual(this.value, this.savedValue);
  }

  public get options() {
    const options =
      this.expandable && this.expandCount && !this.expanded
        ? this._options.slice(0, this.expandCount)
        : this._options;

    return options.map(option => ({
      ...option,
      onPress: () => this.setValue(option.value),
      isActive: this.checkActive(option.value),
    }));
  }

  public apply() {
    this.savedValue = this.value;
  }

  public cancel() {
    this.value = this.savedValue ?? this.defaultValue;
  }

  public checkActive(value: Value) {
    if (this.multiple && Array.isArray(this.value)) {
      return this.value.includes(value);
    } else {
      return this.value === value;
    }
  }

  public setValue(value?: Value) {
    if (value !== undefined) {
      if (this.multiple) {
        if (Array.isArray(this.value)) {
          if (this.value.includes(value)) {
            this.value = this.value.filter(
              item => item !== value,
            ) as Multiple extends true ? Value[] : Value;
          } else {
            this.value = [...this.value, value] as Multiple extends true
              ? Value[]
              : Value;
          }
        } else {
          this.value = [value] as Multiple extends true ? Value[] : Value;
        }
      } else {
        this.value = value as Multiple extends true ? Value[] : Value;
      }
    }
  }

  public reset(value?: Multiple extends true ? Value[] : Value) {
    if (value !== undefined) {
      this.value = value;
    } else {
      this.value = this.defaultValue;
      this.savedValue = this.value;
    }
  }

  public toggleExpand() {
    this.expanded = !this.expanded;
  }
}
