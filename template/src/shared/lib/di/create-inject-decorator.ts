import "reflect-metadata";

import { inject, optional } from "inversify";
import decorators from "inversify-inject-decorators";
import { useRef } from "react";
import shortid from "shortid";

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

function createInjectDecorator<TInterface>(): IInjectDecorator<TInterface> {
  const name: string = shortid();

  function injectDecoratorFactory(options?: IIoCDecoratorOptions) {
    return function injectDecorator(
      target: any,
      targetKey?: string,
      index?: number,
    ) {
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
  }

  injectDecoratorFactory.Tid = name;

  injectDecoratorFactory.getInstance = (options?: { optional?: true }) => {
    const isOpt = options?.optional ?? false;
    const isBound = iocContainer.isBound(name);

    return (
      isBound || !isOpt ? iocContainer.get<TInterface>(name) : undefined
    ) as TInterface;
  };

  injectDecoratorFactory.useInstance = function useInstance() {
    return useRef(injectDecoratorFactory.getInstance()).current;
  };

  return injectDecoratorFactory as IInjectDecorator<TInterface>;
}

export { createInjectDecorator };
