import {makeAutoObservable, when} from 'mobx';
import {isFunction, LambdaValue, resolveLambdaValue} from '@force-dev/utils';

export class ValueHolder<T> {
  private _value: LambdaValue<T>;

  constructor(value: LambdaValue<T>) {
    this._value = value;
    makeAutoObservable(this, {}, {autoBind: true});
  }

  public setValue(value: LambdaValue<T>) {
    this._value = value;
  }

  public get value() {
    return resolveLambdaValue(this._value);
  }

  public get isLambda() {
    return isFunction(this._value);
  }

  public whenChanged() {
    const value = this.value;
    return when(() => this.value !== value);
  }
}
