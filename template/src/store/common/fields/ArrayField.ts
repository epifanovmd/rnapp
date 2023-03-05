import {isFunction, LambdaValue, resolveLambdaValue} from '@force-dev/utils';
import {makeAutoObservable} from 'mobx';
import {isUndefined} from 'lodash';

type Validator<T> = (items: T[]) => string;

export class ArrayField<T = any> {
  private _validate: Validator<T> | null = null;
  private _error: LambdaValue<string> = '';
  private _value: LambdaValue<T[]> = [];

  constructor(value?: LambdaValue<T[]>) {
    makeAutoObservable(this, {}, {autoBind: true});
    if (value) {
      this._value = value;
    }
  }

  get error() {
    return resolveLambdaValue(this._error);
  }

  get value() {
    return resolveLambdaValue(this._value);
  }

  get isValid() {
    return !resolveLambdaValue(this._error);
  }

  setValue(value: LambdaValue<T[]>) {
    this._value = value;
  }

  onSetValue(value: LambdaValue<T>, index?: number) {
    const _value = resolveLambdaValue(value);
    const newValue = !isUndefined(index)
      ? resolveLambdaValue(this._value).map((item, _index) =>
          _index === index ? _value : item,
        )
      : [...resolveLambdaValue(this._value), _value];

    if (isFunction(this._value)) {
      this._value = () => newValue;
    }

    this._error = this._validate?.(newValue) ?? '';
    this._value = newValue;
  }

  setError(error: LambdaValue<string>) {
    this._error = resolveLambdaValue(error);
  }

  setValidate(validator: Validator<T>) {
    this._validate = validator;
  }
}
