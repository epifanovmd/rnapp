import {
  getEnumNamesAndValues,
  LambdaValue,
  Maybe,
  stringCapitalize,
} from "@shared/lib/utils";

import { DataModelBase } from "./data-model-base";

type TEnumProps<TEnum> = {
  [K in keyof TEnum as `is${Capitalize<string & K>}`]: boolean;
};
type EnumValue<TEnum> = TEnum[keyof TEnum];
type ModelClassType<T, TEnum> = new (
  enm: LambdaValue<Maybe<EnumValue<TEnum>>>,
) => T;
type TEnumModelBase<TEnum> = ModelClassType<
  TEnumProps<TEnum> & DataModelBase<Maybe<EnumValue<TEnum>>>,
  TEnum
>;

export const createEnumModelBase = <TEnum>(enm: any) => {
  class EnumModel extends DataModelBase<Maybe<EnumValue<TEnum>>> {}

  getEnumNamesAndValues<any>(enm).forEach(item => {
    const key = `is${stringCapitalize(item.name)}`;

    Object.defineProperty(EnumModel.prototype, key, {
      get() {
        return this.data === item.value;
      },
      configurable: true,
    });
  });

  return EnumModel as TEnumModelBase<TEnum>;
};
