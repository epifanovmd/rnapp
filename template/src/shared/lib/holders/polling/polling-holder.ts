import { action, makeObservable, observable } from "mobx";

import { EntityHolder, IEntityHolderOptions } from "../entity/entity-holder";
import { IHolderError } from "../holder.types";

export type PollingStartOptions<TArgs> = TArgs extends void
  ? { interval?: number } | undefined
  : { args: TArgs; interval?: number };

export interface IPollingHolderOptions<
  TData,
  TArgs = void,
> extends IEntityHolderOptions<TData, TArgs> {
  interval?: number;
}

export class PollingHolder<
  TData,
  TArgs = void,
  TError extends IHolderError = IHolderError,
> extends EntityHolder<TData, TArgs, TError> {
  isPolling = false;

  private _timeoutId: ReturnType<typeof setTimeout> | null = null;
  private _pollGeneration = 0;
  private readonly _defaultInterval: number;

  constructor(options?: IPollingHolderOptions<TData, TArgs>) {
    super(options);
    this._defaultInterval = options?.interval ?? 5000;

    makeObservable(this, {
      isPolling: observable,
      startPolling: action,
      stopPolling: action,
    });
  }

  startPolling(options?: PollingStartOptions<TArgs>): void {
    this.stopPolling();

    const typedOptions = options as
      { args?: TArgs; interval?: number } | undefined;
    const args = typedOptions?.args as TArgs;
    const interval = typedOptions?.interval ?? this._defaultInterval;

    this.isPolling = true;

    const generation = ++this._pollGeneration;

    type AnyLoadFn = (args: TArgs) => Promise<unknown>;

    const isCurrent = () =>
      this.isPolling && generation === this._pollGeneration;

    const schedule = () => {
      if (!isCurrent()) return;
      this._timeoutId = setTimeout(async () => {
        if (!isCurrent()) return;
        await (this.refresh as unknown as AnyLoadFn)(args);
        schedule();
      }, interval);
    };

    if (this.isIdle) {
      (this.load as unknown as AnyLoadFn)(args).then(() => {
        if (isCurrent()) schedule();
      });
    } else {
      schedule();
    }
  }

  stopPolling(): void {
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    this.isPolling = false;
    this._pollGeneration++;
  }

  override reset(): void {
    this.stopPolling();
    super.reset();
  }
}
