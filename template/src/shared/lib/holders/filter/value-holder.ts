import {
  LambdaValue,
  resolveLambdaValue,
} from "@shared/lib/utils/lambda-value";
import { isFunction } from "@shared/lib/utils/type-guards";
import { action, computed, makeObservable, observable, when } from "mobx";

export class ValueHolder<T> {
  private _value: LambdaValue<T>;

  constructor(value: LambdaValue<T>) {
    this._value = value;
    makeObservable(
      this,
      {
        // @ts-expect-error _value
        _value: observable,
        setValue: action,
        value: computed,
        isLambda: computed,
      },
      { autoBind: true },
    );
  }

  public setValue = (value: LambdaValue<T>) => {
    this._value = value;
  };

  public get value() {
    return resolveLambdaValue(this._value);
  }

  public get isLambda() {
    return isFunction(this._value);
  }

  public whenChanged = () => {
    const value = this.value;

    return when(() => this.value !== value);
  };
}
