export type InitializeDispose =
  | void
  | (() => void)
  | (() => void)[]
  | Promise<void | (() => void) | (() => void)[]>;

export interface SupportInitialize<T extends any = undefined> {
  initialize: T extends undefined
    ? () => InitializeDispose
    : (data: T) => InitializeDispose;
}
