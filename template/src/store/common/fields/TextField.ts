import {
  iocDecorator,
  iocHook,
  LambdaValue,
  resolveLambdaValue,
} from '@force-dev/utils';
import {makeAutoObservable, reaction} from 'mobx';

type Validator = (text: string) => string;

export const ITextField = iocDecorator<TextField>();
export const useTextField = iocHook(ITextField);

@ITextField()
export class TextField {
  private _validate: Validator | null = null;

  constructor() {
    makeAutoObservable(this, {}, {autoBind: true});

    reaction(
      () => this.value,
      text => {
        this.setError(this._validate?.(text) ?? '');
      },
    );
  }

  private _error: LambdaValue<string> = '';

  public get error() {
    return resolveLambdaValue(this._error);
  }

  private _placeholder: LambdaValue<string> = '';

  public get placeholder() {
    return resolveLambdaValue(this._placeholder);
  }

  private _value: LambdaValue<string> = '';

  public get value() {
    return resolveLambdaValue(this._value);
  }

  private _inputValue: LambdaValue<string> = '';

  public get inputValue() {
    return resolveLambdaValue(this._inputValue);
  }

  get isValid() {
    return !resolveLambdaValue(this._error);
  }

  onChangeText(text: LambdaValue<string>) {
    this._value = text;
    this._inputValue = text;
  }

  onSetValue(text: LambdaValue<string>) {
    this._value = text;
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

  setValidate(validator: Validator) {
    this._validate = validator;
  }
}
