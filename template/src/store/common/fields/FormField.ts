import {makeAutoObservable} from 'mobx';
import {identity, pickBy, toUpper} from 'lodash';
import {ArrayField} from './ArrayField';
import {TextField} from './TextField';

type Setter<T> = Required<{
  [K in keyof T as `set${Capitalize<string & K>}`]: T[K] extends
    | FormField
    | TextField
    | ArrayField
    ? T[K]['setValue']
    : (value: T[K]) => void;
}>;

type Opts = {
  validateOnInit?: boolean;
};

type SubType<Base, Condition> = Pick<
  Base,
  {
    [Key in keyof Base]: Exclude<Base[Key], undefined> extends Condition
      ? never
      : Key;
  }[keyof Base]
>;

type ExtractFields<T> = SubType<T, FormField | TextField | ArrayField>;

type Validation<T, V = ExtractFields<T>> = {
  [Key in keyof V]?: (value: V[Key]) => string;
};

export type FormPartial<T> = {
  [K in keyof T]: T[K] extends FormField
    ? T[K]
    : T[K] extends TextField | ArrayField
    ? T[K]
    : T[K] | undefined;
};

export class FormField<T extends object = object> {
  private opts: Opts = {};
  private _validate: Validation<Partial<T>> = {};
  private _error: Partial<Record<keyof T, string>> = {};
  private _initialValue: FormPartial<T> = {} as FormPartial<T>;
  private _value: FormPartial<T> = {} as FormPartial<T>;

  constructor(initialValue: FormPartial<T>, opts?: Opts) {
    makeAutoObservable(this, {}, {autoBind: true});

    this._initialValue = initialValue;
    this._value = initialValue;
    this.opts = opts || {};

    if (opts?.validateOnInit) {
      this._validateAll();
    }
  }

  get error() {
    return this._error;
  }

  get value() {
    return this._value;
  }

  get isValid() {
    let _isValid: boolean = true;
    const value = this.value;
    for (const key in value) {
      if (
        value.hasOwnProperty(key) &&
        (value[key] instanceof FormField ||
          value[key] instanceof TextField ||
          value[key] instanceof ArrayField)
      ) {
        const field = value[key];
        if (!(field as FormField | TextField | ArrayField).isValid) {
          _isValid = false;
          break;
        }
      }
    }
    return Object.keys(pickBy(this._error, identity)).length === 0 && _isValid;
  }

  setValue<K extends keyof T>(name: K, value: T[K]) {
    this.setError(name, this._validate[name]?.(value));
    this._value[name] = value;
  }

  resetData(value?: FormPartial<T>) {
    this._value = value || this._initialValue;
    this._validateAll();
  }

  setError(name: keyof T, error?: string) {
    this._error[name] = error;
  }

  get setters(): Setter<T> {
    const setters: any = {};

    const value = this.value;
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        const _key = `set${toUpper(key[0])}${key.slice(1, key.length)}`;

        if (value[key] instanceof FormField) {
          setters[_key] = (value[key] as FormField).setValue;
        } else if (value[key] instanceof TextField) {
          setters[_key] = (value[key] as TextField).setValue;
        } else if (value[key] instanceof ArrayField) {
          setters[_key] = (value[key] as ArrayField).setValue;
        } else {
          setters[_key] = (data: T[Extract<keyof T, string>]) => {
            this.setValue(key, data);
          };
        }
      }
    }

    return setters as Setter<T>;
  }

  setValidate(validator: Validation<Partial<T>>) {
    this._validate = validator;
  }

  private _validateAll() {
    Object.keys(this.value).forEach((key: string) => {
      const name: keyof T = key as keyof T;
      this.setError(name, this._validate[name]?.(this.value[name]));
    });
  }
}

// const form = new FormField<{
//   object: FormField<{a: string; b: number}>;
//   string: string;
//   number: number;
//   array: ArrayField<{a: number; b: string}>;
//   textField: TextField;
// }>(
//   {
//     // тут нужно избавится от дженерика, неверно выводится из object сейчас
//     object: new FormField<{a: string; b: number}>({
//       a: undefined,
//       b: undefined,
//     }),
//     string: undefined,
//     number: undefined,
//     array: new ArrayField(),
//     textField: new TextField(),
//   },
//   {},
// );

// form.setValidate({
//   // нужно исключить все ключи у которых значение является не примитивным типом (FormField, ArrayField, TextField)
//   number: value => (value && value > 5 ? 'Значение Больше 5' : ''),
//   string: value => (value && value.length > 5 ? 'Больше 5' : ''),
// });
//
// form.value.textField.setValidate(value =>
//   value !== '123' ? 'Значение не равно 123' : '',
// );
//
// form.value.array.setValidate(value =>
//   value.length > 3 ? 'длинна массива больше 3' : '',
// );
//
// form.value.object.setValidate({
//   a: value => (value && value.length > 5 ? 'Длинна а больше 5' : ''),
//   b: value => (value && value > 5 ? 'Число b больше 5' : ''),
// });
//
// form.setters.setObject('a', '53333');
//
//
// form.setters.setObject('b', 3);
// form.setters.setObject('a', '3');
//
// form.value.object.setters.setA('343');
// form.value.object.setters.setB(323);
//
// form.setters.setNumber(33);
// form.setters.setString('333');
//
// form.value.array.onSetValue({a: 1, b: '3333'});
// form.setters.setArray({a: 1, b: '3333'}, 0);
//
// form.value.textField.onSetValue('12344');
// form.setters.setTextField('444');
