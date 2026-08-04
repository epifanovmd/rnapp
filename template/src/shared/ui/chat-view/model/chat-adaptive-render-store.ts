export type ChatAdaptiveRenderMode = "normal" | "light";

/**
 * Режим рендера строк: на быстром броске список просит облегчённую отрисовку.
 *
 * Внешний стор — чтобы оверлей контекстного меню (вне списка) тоже знал режим.
 */
export class ChatAdaptiveRenderStore {
  private _mode: ChatAdaptiveRenderMode = "normal";
  private readonly _listeners = new Set<() => void>();

  getMode = (): ChatAdaptiveRenderMode => this._mode;

  set = (mode: ChatAdaptiveRenderMode) => {
    if (this._mode === mode) return;

    this._mode = mode;
    this._listeners.forEach(listener => listener());
  };

  subscribe = (listener: () => void) => {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  };
}
