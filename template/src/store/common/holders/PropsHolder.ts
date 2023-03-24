import {makeAutoObservable, when} from 'mobx';
import {LambdaValue, Maybe, resolveLambdaValue} from '@force-dev/utils';

export class PropsHolder<T> {
  _value: LambdaValue<Maybe<T>>;
  _isActive: LambdaValue<boolean>;

  constructor(
    value: LambdaValue<Maybe<T>> = undefined,
    isActive: LambdaValue<boolean> = false,
  ) {
    this._value = value;
    this._isActive = isActive;
    makeAutoObservable(this, {}, {autoBind: true});
  }

  public setValue(value: LambdaValue<T>) {
    this._value = value;
  }

  public setActive(isActive: LambdaValue<boolean> = false) {
    this._isActive = isActive;
  }

  public get value() {
    return resolveLambdaValue(this._value);
  }

  public get isActive() {
    return resolveLambdaValue(this._isActive);
  }

  public whenChanged() {
    const value = this.value;
    return when(() => this.value !== value);
  }
}
