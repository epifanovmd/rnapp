const BASE_DELAY = 1000; // 1s → 2s → 4s → 8s → 10s max
const MAX_DELAY = 10_000;

export class ReconnectScheduler {
  private _attempt = 0;
  private _timer: ReturnType<typeof setTimeout> | null = null;

  schedule(fn: () => void): void {
    if (this._timer !== null) return;

    const delay = Math.min(BASE_DELAY * Math.pow(2, this._attempt), MAX_DELAY);

    this._attempt++;
    this._timer = setTimeout(() => {
      this._timer = null;
      fn();
    }, delay);
  }

  reset(): void {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }

    this._attempt = 0;
  }
}
