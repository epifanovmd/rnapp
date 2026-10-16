import "reflect-metadata";

import { inject, optional } from "inversify";
import decorators from "inversify-inject-decorators";
import { useRef } from "react";

import { iocContainer } from "./container";

export interface IIoCDecoratorOptions {
  optional?: true;
}

export interface IInjectDecorator<T> {
  readonly Tid: string;

  (
    options?: IIoCDecoratorOptions,
  ): (target: any, targetKey?: string, index?: number) => void;

  getInstance(options?: { optional?: true }): T;

  useInstance(): T;
}

const { lazyInject } = decorators(iocContainer);

/**
 * Декоратор-токен сервиса. `name` — стабильный строковый идентификатор в
 * Inversify-контейнере (обычно имя интерфейса, например `"IAuthStore"`):
 * литерал не меняется при hot reload, поэтому биндинги остаются валидными.
 */
const createInjectDecorator = <TInterface>(
  name: string,
): IInjectDecorator<TInterface> => {
  const injectDecoratorFactory = (options?: IIoCDecoratorOptions) => {
    return (target: any, targetKey?: string, index?: number) => {
      if (index !== undefined) {
        inject(name)(target, targetKey!, index);
        if (options?.optional) {
          optional()(target, targetKey!, index);
        }
      } else if (targetKey) {
        if (options?.optional) {
          inject(name)(target, targetKey);
          optional()(target, targetKey);
        } else {
          lazyInject(name)(target, targetKey);
        }
      } else {
        throw new Error(
          `Service identifier "${name}" can no longer be applied as a class decorator. ` +
            `Mark the class with @injectable() and bind it explicitly via bind(<Identifier>.Tid).to(<Class>) ` +
            `inside the owning domain's *.module.ts.`,
        );
      }
    };
  };

  injectDecoratorFactory.Tid = name;

  injectDecoratorFactory.getInstance = (options?: { optional?: true }) => {
    const isOpt = options?.optional ?? false;
    const isBound = iocContainer.isBound(name);

    return (
      isBound || !isOpt ? iocContainer.get<TInterface>(name) : undefined
    ) as TInterface;
  };

  /** Экземпляр берётся из контейнера один раз на жизнь компонента. */
  const useInstance = (): TInterface => {
    const ref = useRef<{ instance: TInterface } | null>(null);

    if (!ref.current) {
      ref.current = { instance: injectDecoratorFactory.getInstance() };
    }

    return ref.current.instance;
  };

  injectDecoratorFactory.useInstance = useInstance;

  return injectDecoratorFactory as IInjectDecorator<TInterface>;
};

export { createInjectDecorator };
