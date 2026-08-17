import { type IApiResponse } from "../holder.types";

export interface TestItem {
  id: number;
  name: string;
}

export const item = (id: number): TestItem => ({
  id,
  name: `item-${id}`,
});

export const cancelError = { __CANCEL__: true };

export const cancelResponse: IApiResponse<never> & { isCanceled: true } = {
  isCanceled: true,
};

export const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};
