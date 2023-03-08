import {isFunction, LambdaValue, resolveLambdaValue} from '@force-dev/utils';
import {makeAutoObservable} from 'mobx';

type Validator<T> = (items: T[]) => string;

type Opts = {
  validateOnInit?: boolean;
};

export class ArrayHolder<T = any> {
  private opts: Opts = {};
  private _validate: Validator<T> | null = null;
  private _error: LambdaValue<string> = '';
  private _value: LambdaValue<T[]> = [];

  constructor(value?: LambdaValue<T[]>, opt?: Opts) {
    makeAutoObservable(this, {}, {autoBind: true});
    if (value) {
      this._value = value;
    }

    this.opts = opt || {};

    if (opt?.validateOnInit) {
      this.setError(this._validate?.(this.value) ?? '');
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

  remove(value: number | ((item: T) => boolean)) {
    if (isFunction(value)) {
      this._value = () => this.value.filter(value);
    }
    this._value = () => this.value.filter((_item, index) => index !== value);
  }

  push(value: LambdaValue<T>) {
    const _value = resolveLambdaValue(value);
    const newValue = [...resolveLambdaValue(this._value), _value];

    this._value = () => newValue;
    this.setError(this._validate?.(newValue) ?? '');
  }

  onReplaceValue(value: LambdaValue<T>, index: number) {
    const _value = resolveLambdaValue(value);
    const newValue = resolveLambdaValue(this._value).map((item, _index) =>
      _index === index ? _value : item,
    );

    this._value = () => newValue;
    this.setError(this._validate?.(newValue) ?? '');
  }

  setError(error: LambdaValue<string>) {
    this._error = resolveLambdaValue(error);
  }

  setValidate(validator: Validator<T>) {
    this._validate = validator;
  }
}
