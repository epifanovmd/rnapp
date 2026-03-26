import { action, computed, makeObservable, observable, when } from "mobx";

import { LambdaValue, resolveLambdaValue } from "../helpers/lambdaValue";
import { isFunction } from "../helpers/typeGuards";

export class ValueHolder<T> {
  private _value: LambdaValue<T>;

  constructor(value: LambdaValue<T>) {
    this._value = value;
    makeObservable(
      this,
      {
        // @ts-ignore
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
