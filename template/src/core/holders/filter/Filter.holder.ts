import { ValueHolder } from "@force-dev/utils";
import { isEqual } from "lodash";
import { makeAutoObservable, reaction, runInAction } from "mobx";

import {
  IFilterItemHolder,
  IFilterOption,
  TFilterMultipleType,
  TFilterOptions,
  TFilterValueType,
} from "./Filter.types";

export type TFilterConfig = Record<string, FilterHolder<any, any, boolean>>;

export class FilterHolder<
  Value = unknown,
  Default extends Value | undefined = undefined,
  Multiple extends boolean = false,
> {
  public readonly title: string;
  public readonly hint?: string;
  public readonly multiple?: Multiple;
  public defaultValue?: TFilterMultipleType<Default, Multiple>;
  public value: TFilterValueType<Value, Default, Multiple>;
  public savedValue: TFilterValueType<Value, Default, Multiple>;
  public readonly expandable?: boolean;
  public readonly expandCount?: number;
  public expanded: boolean = true;
  public isLoading: boolean = false;

  private readonly _optionsHolder = new ValueHolder<TFilterOptions<Value>>([]);
  private readonly _optionsDataHolder = new ValueHolder<IFilterOption<Value>[]>(
    [],
  );

  constructor(data: IFilterItemHolder<Value, Default, Multiple>) {
    this.title = data.title;
    this.hint = data.hint;
    this.multiple = data.multiple;
    this.defaultValue = data.defaultValue;
    this.value = (data.value ?? data.defaultValue) as typeof this.value;
    this.savedValue = (data.value ?? data.defaultValue) as typeof this.value;
    this.expandable = data.expandable;
    this.expandCount = data.expandCount;
    this.expanded = !(data.expandable && data.expandCount);

    this._optionsHolder.setValue(data.options);

    makeAutoObservable(this, {}, { autoBind: true });

    reaction(
      () => this._optionsHolder.value,
      opts => this._loadOptions(opts),
      { fireImmediately: true },
    );
  }

  public get isEqual() {
    return isEqual(this.savedValue, this.defaultValue);
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

  public get hasOptions() {
    return this._options.length > 0;
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
              item => !isEqual(item, value),
            ) as typeof this.value;
          } else {
            this.value = [...this.value, value] as typeof this.value;
          }
        } else {
          this.value = [value] as typeof this.value;
        }
      } else {
        this.value = value as typeof this.value;
      }
    }
  }

  public apply() {
    if (this.value && this._options.length > 0) {
      const isValidValue =
        this.multiple && Array.isArray(this.value)
          ? this.value.every(val =>
              this._options.some(option => isEqual(option.value, val)),
            )
          : this._options.some(option => isEqual(option.value, this.value));

      if (!isValidValue) {
        this.reset();

        return;
      }
    }

    this.savedValue = this.value;
    this.cancelExpand();
  }

  public cancel() {
    this.value = (this.savedValue ?? this.defaultValue) as typeof this.value;
  }

  public reset(value?: typeof this.value) {
    if (value !== undefined) {
      this.value = value;
    } else {
      this.value = this.defaultValue as typeof this.value;
      this.savedValue = this.value;

      this.cancelExpand();
    }
  }

  public toggleExpand() {
    this.expanded = !this.expanded;
  }

  public cancelExpand() {
    if (this.expandable && this.expanded) {
      this.expanded = false;
    }
  }

  private get _options() {
    return this._optionsDataHolder.value;
  }

  private async _loadOptions(options: TFilterOptions<Value>) {
    try {
      if (options instanceof Promise) {
        this.isLoading = true;
        this._optionsDataHolder.setValue([]);
        this._optionsDataHolder.setValue(await options);
      } else {
        this._optionsDataHolder.setValue(options);
      }
    } catch {
      this._optionsDataHolder.setValue([]);
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }
}
