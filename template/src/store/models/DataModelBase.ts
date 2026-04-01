import { LambdaValue, resolveLambdaValue } from "@utils/lambdaValue";
import { isFunction } from "@utils/typeGuards";
import { AnnotationsMap, computed, makeObservable, observable } from "mobx";

export interface IDataModel<TData> {
  readonly data: TData;
}

const annotationsCache = new WeakMap<object, Record<string, unknown>>();

function getAnnotationsForClass(instance: object): Record<string, unknown> {
  const ctor = instance.constructor;

  const cached = annotationsCache.get(ctor);

  if (cached) return cached;

  const annotations: Record<string, unknown> = {
    _data: observable.ref,
  };

  let proto = Object.getPrototypeOf(instance) as object;

  while (proto && proto !== Object.prototype) {
    const descriptors = Object.getOwnPropertyDescriptors(proto);

    for (const [key, desc] of Object.entries(descriptors)) {
      if (desc.get && !(key in annotations)) {
        annotations[key] = computed;
      }
    }

    proto = Object.getPrototypeOf(proto) as object;
  }

  annotationsCache.set(ctor, annotations);

  return annotations;
}

const proxyHandler: ProxyHandler<DataModelBase<any>> = {
  get(target, prop, receiver) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }

    const data = target.data;

    if (data != null && typeof data === "object" && prop in (data as object)) {
      return (data as Record<string | symbol, unknown>)[prop];
    }

    return undefined;
  },

  has(target, prop) {
    if (prop in target) return true;

    const data = target.data;

    return data != null && typeof data === "object" && prop in (data as object);
  },
};

/**
 * Базовый класс для моделей данных.
 *
 * - Автоматически регистрирует все getters как MobX computed
 * - Проксирует доступ к полям `data` — `model.id` вместо `model.data.id`
 * - Подклассы могут переопределять любое поле через getter
 * - Аннотации кешируются по классу — сканирование один раз
 * - `extraAnnotations` позволяет добавить/переопределить MobX аннотации
 *
 * @example
 * ```ts
 * class MyModel extends TypedModel<MyDto>() {
 *   selectedId: string | null = null;
 *
 *   constructor(data: MyDto) {
 *     super(data, { selectedId: observable });
 *   }
 * }
 * ```
 */
export class DataModelBase<TData> implements IDataModel<TData> {
  private readonly _data: LambdaValue<TData>;

  constructor(
    value: LambdaValue<TData>,
    extraAnnotations?: Record<string, unknown>,
  ) {
    this._data = value;

    const autoAnnotations = getAnnotationsForClass(this);
    const annotations = extraAnnotations
      ? { ...autoAnnotations, ...extraAnnotations }
      : autoAnnotations;

    makeObservable(this, annotations as AnnotationsMap<this, never>);

    return new Proxy(this, proxyHandler) as this;
  }

  public get data() {
    return resolveLambdaValue(this._data);
  }

  public get hasLambda() {
    return isFunction(this._data);
  }
}

/**
 * Типизированная база для моделей — добавляет все свойства TData
 * к типу модели автоматически, без interface merging.
 *
 * @example
 * ```ts
 * export class UserModel extends TypedModel<UserDto>() {
 *   get displayName() { return this.firstName + ' ' + this.lastName; }
 * }
 *
 * const m = new UserModel(dto);
 * m.id          // string     — из UserDto через Proxy
 * m.displayName // string     — custom computed getter
 * m.data        // UserDto    — полный объект данных
 * ```
 */
export function TypedModel<TData>() {
  return DataModelBase as unknown as new (
    data: LambdaValue<TData>,
    extraAnnotations?: Record<string, unknown>,
  ) => DataModelBase<TData> & Readonly<TData>;
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
export function createModelMapper<TItem, TModel extends DataModelBase<TItem>>(
  keyExtractor: (item: TItem) => string | number,
  factory: (item: TItem) => TModel,
): (items: TItem[]) => TModel[] {
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
}
