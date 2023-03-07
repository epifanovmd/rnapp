import {LambdaValue, resolveLambdaValue} from '@force-dev/utils';
import {makeAutoObservable} from 'mobx';

const textToNumber = (value: LambdaValue<string> = () => '') => {
  const text = resolveLambdaValue(value);
  return text.replace(/[^0-9]+/g, '');
};

type Opts = {
  initialValue?: LambdaValue<string>;
  number?: boolean;
  validateOnInit?: boolean;
};

export class TextField {
  private opts?: Opts;
  private _validate: ((text: string) => string) | null = null;
  private _error: LambdaValue<string> = '';
  private _placeholder: LambdaValue<string> = '';
  private _value: LambdaValue<string> = '';
  private _inputValue: LambdaValue<string> = '';

  constructor(opts?: Opts) {
    makeAutoObservable(this, {}, {autoBind: true});

    this.opts = opts;
    if (opts?.initialValue) {
      this._value = opts?.initialValue;
    }
    if (opts?.validateOnInit) {
      this.setError(this._validate?.(this.value) ?? '');
    }
  }

  get error() {
    return resolveLambdaValue(this._error);
  }

  get placeholder() {
    return resolveLambdaValue(this._placeholder);
  }

  get value() {
    return resolveLambdaValue(this._value);
  }

  get inputValue() {
    return resolveLambdaValue(this._inputValue);
  }

  get isValid() {
    return !resolveLambdaValue(this._error);
  }

  onChangeText(text: LambdaValue<string>) {
    this.setValue(text);
    this._inputValue = this._value;
  }

  setValue(text: LambdaValue<string>) {
    const value = resolveLambdaValue(
      this.opts?.number ? textToNumber(text) : text,
    );
    this.setError(this._validate?.(value) ?? '');
    this._value = value;
  }

  onSetInputValue(text: LambdaValue<string>) {
    this._inputValue = resolveLambdaValue(text);
  }

  setPlaceholder(text: LambdaValue<string>) {
    this._placeholder = resolveLambdaValue(text);
  }

  setError(error: LambdaValue<string>) {
    this._error = resolveLambdaValue(error);
  }

  setValidate(validator: typeof this._validate) {
    this._validate = validator;
  }
}
