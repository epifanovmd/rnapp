import { InitializeDispose } from "./types";

export const disposer = (dispose: InitializeDispose | InitializeDispose[]) => {
  if (dispose instanceof Promise) {
    dispose
      .then(disposable => {
        if (typeof disposable === "function") {
          disposer(disposable);
        }
        if (Array.isArray(disposable)) {
          disposable.forEach(disposer);
        }
      })
      .catch();
  }

  if (Array.isArray(dispose)) {
    dispose.forEach(disposer);
  }

  if (typeof dispose === "function") {
    dispose();
  }
};

export class Disposer {
  private _disposes = new Set<InitializeDispose>();

  add = (...disposes: InitializeDispose[]): this => {
    disposes.forEach(dispose => this._disposes.add(dispose));

    return this;
  };

  dispose = (): void => {
    const disposes = Array.from(this._disposes);

    this._disposes.clear();
    disposer(disposes);
  };

  get size(): number {
    return this._disposes.size;
  }
}

export const createDisposer = (): Disposer => new Disposer();
