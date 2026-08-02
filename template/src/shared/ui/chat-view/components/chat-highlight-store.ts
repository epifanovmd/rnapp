/**
 * Подсветка одного сообщения после `scrollToMessage({ highlight: true })`.
 *
 * Внешний стор, а не shared value: подсвеченное сообщение всегда одно, и
 * оверлей вспышки должен монтироваться только у него — иначе на каждую ячейку
 * списка приходилась бы лишняя `Animated.View` с нулевой прозрачностью.
 */
export class ChatHighlightStore {
  private _id: string | null = null;
  /** Растёт на каждый вызов, поэтому повторная подсветка того же id срабатывает. */
  private _token = 0;
  private readonly _listeners = new Set<() => void>();

  /** Токен подсветки для сообщения; `0` — сообщение не подсвечено. */
  tokenOf(id: string): number {
    return this._id === id ? this._token : 0;
  }

  highlight(id: string) {
    this._id = id;
    this._token += 1;
    this._listeners.forEach(listener => listener());
  }

  clear(id: string) {
    if (this._id !== id) return;

    this._id = null;
    this._listeners.forEach(listener => listener());
  }

  subscribe = (listener: () => void) => {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  };
}
