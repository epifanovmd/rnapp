import {
  LambdaValue,
  resolveLambdaValue,
} from "@shared/lib/utils/lambda-value";
import { isFunction } from "@shared/lib/utils/type-guards";
import { computed, makeObservable, observable } from "mobx";

export interface IDataModel<TData> {
  readonly data: TData;
}

/**
 * Модель поверх DTO. Сам DTO не копируется и не оборачивается: `_data` —
 * `observable.ref`, реакция идёт на замену объекта целиком. Геттеры
 * наследников помечаются `computed` явно в их `makeObservable`.
 */
export class DataModelBase<TData> implements IDataModel<TData> {
  private readonly _data: LambdaValue<TData>;

  constructor(value: LambdaValue<TData>) {
    this._data = value;

    makeObservable(this, {
      // @ts-expect-error _data
      _data: observable.ref,
      data: computed,
      hasLambda: computed,
    });
  }

  public get data() {
    return resolveLambdaValue(this._data);
  }

  public get hasLambda() {
    return isFunction(this._data);
  }
}

/**
 * Создаёт мемоизированный маппер DTO → Model.
 * При повторном вызове возвращает тот же экземпляр модели,
 * если DTO-объект (по ссылке) не изменился.
 *
 * Это предотвращает пересоздание всех моделей в computed-геттерах,
 * когда изменился только один элемент в массиве.
 *
 * @example
 * ```ts
 * class ChatListStore {
 *   private _toModels = createModelMapper<ChatDto, ChatModel>(
 *     c => c.id,
 *     c => new ChatModel(c),
 *   );
 *
 *   get models() {
 *     return this._toModels(this.listHolder.items);
 *   }
 * }
 * ```
 */
export const createModelMapper = <TItem, TModel extends DataModelBase<TItem>>(
  keyExtractor: (item: TItem) => string | number,
  factory: (item: TItem) => TModel,
): ((items: TItem[]) => TModel[]) => {
  let cache = new Map<string | number, TModel>();

  return (items: TItem[]): TModel[] => {
    const next = new Map<string | number, TModel>();

    const result = items.map(item => {
      const key = keyExtractor(item);
      const existing = cache.get(key);

      if (existing && existing.data === item) {
        next.set(key, existing);

        return existing;
      }

      const model = factory(item);

      next.set(key, model);

      return model;
    });

    cache = next;

    return result;
  };
};
