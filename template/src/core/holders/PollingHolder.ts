import { action, makeObservable, observable } from "mobx";

import { EntityHolder, IEntityHolderOptions } from "./EntityHolder";
import { IHolderError } from "./HolderTypes";

// ---------------------------------------------------------------------------

export type PollingStartOptions<TArgs> = TArgs extends void
  ? { interval?: number } | undefined
  : { args: TArgs; interval?: number };

export interface IPollingHolderOptions<TData, TArgs = void>
  extends IEntityHolderOptions<TData, TArgs> {
  /** Default polling interval in ms (default: 5000). */
  interval?: number;
}

// ---------------------------------------------------------------------------

/**
 * Extends `EntityHolder` with automatic polling.
 *
 * The next request starts `interval` ms **after the previous one completes**,
 * so slow responses never cause parallel request accumulation.
 *
 * - `startPolling(options?)` - initial load (if idle) + periodic silent refresh
 * - `stopPolling()` - stops polling
 * - `reset()` - stops polling and resets to idle
 * - `isPolling` - observable flag
 */
export class PollingHolder<
  TData,
  TArgs = void,
  TError extends IHolderError = IHolderError,
> extends EntityHolder<TData, TArgs, TError> {
  isPolling = false;

  private _timeoutId: ReturnType<typeof setTimeout> | null = null;
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

  /**
   * Starts polling.
   *
   * If the holder is idle, immediately performs `load()`, then begins
   * the refresh cycle. Each request waits for the previous one to complete
   * before scheduling the next.
   *
   * Calling again while already polling restarts the cycle.
   */
  startPolling(options?: PollingStartOptions<TArgs>): void {
    this.stopPolling();

    const typedOptions = options as
      | { args?: TArgs; interval?: number }
      | undefined;
    const args = typedOptions?.args as TArgs;
    const interval = typedOptions?.interval ?? this._defaultInterval;

    this.isPolling = true;

    type AnyLoadFn = (args: TArgs) => Promise<unknown>;

    const schedule = () => {
      if (!this.isPolling) return;
      this._timeoutId = setTimeout(async () => {
        if (!this.isPolling) return;
        await (this.refresh as unknown as AnyLoadFn)(args);
        schedule();
      }, interval);
    };

    if (this.isIdle) {
      (this.load as unknown as AnyLoadFn)(args).then(schedule);
    } else {
      schedule();
    }
  }

  /** Stops polling. */
  stopPolling(): void {
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    this.isPolling = false;
  }

  override reset(): void {
    this.stopPolling();
    super.reset();
  }
}
