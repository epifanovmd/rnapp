import {
  iocDecorator,
  iocHook,
  LambdaValue,
  resolveLambdaValue,
} from '@force-dev/utils';
import {makeAutoObservable, observable, reaction} from 'mobx';

type Validator = (text: string) => string;

export const ITextField = iocDecorator<TextField>();
export const useTextField = iocHook(ITextField);

@ITextField()
export class TextField {
  error: string = '';
  placeholder: string = '';
  value: string = '';
  inputValue: string = '';
  private _validate: Validator | null = null;

  constructor() {
    makeAutoObservable(
      this,
      {
        value: observable.ref,
      },
      {autoBind: true},
    );

    reaction(
      () => this.value,
      text => {
        this.setError(this._validate?.(text) ?? '');
      },
    );
  }

  get isValid() {
    return !this.error;
  }

  onChangeText(text: string) {
    this.value = text;
    this.inputValue = text;
  }

  onSetValue(text: LambdaValue<string>) {
    this.value = resolveLambdaValue(text);
  }

  onSetInputValue(text: LambdaValue<string>) {
    this.inputValue = resolveLambdaValue(text);
  }

  setPlaceholder(text: LambdaValue<string>) {
    this.placeholder = resolveLambdaValue(text);
  }

  setError(error: LambdaValue<string>) {
    this.error = resolveLambdaValue(error);
  }

  setValidate(validator: Validator) {
    this._validate = validator;
  }
}
