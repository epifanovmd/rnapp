/**
 * Внешний стор оверлеев (FAB, плавающая дата, empty state, распад) —
 * позволяет обновлять их при скролле без ре-рендера корня и списка.
 */

export interface IDisintegrationBurst {
  key: number;
  frame: { x: number; y: number; width: number; height: number };
  color: string;
}

export interface IChatOverlayState {
  fabVisible: boolean;
  fabExpanded: boolean;
  fabLoading: boolean;
  unreadCount: number;
  floatingDateTitle: string | null;
  floatingDateVisible: boolean;
  /** Сдвиг плашки вверх, когда её подпирает следующий разделитель. */
  floatingDatePush: number;
  emptyVisible: boolean;
  emptyLoading: boolean;
  emptyText: string | null;
  bursts: IDisintegrationBurst[];
}

const INITIAL_STATE: IChatOverlayState = {
  fabVisible: false,
  fabExpanded: false,
  fabLoading: false,
  unreadCount: 0,
  floatingDateTitle: null,
  floatingDateVisible: false,
  floatingDatePush: 0,
  emptyVisible: false,
  emptyLoading: false,
  emptyText: null,
  bursts: [],
};

export class ChatOverlayStore {
  private _state: IChatOverlayState = INITIAL_STATE;
  private readonly _listeners = new Set<() => void>();

  get state(): IChatOverlayState {
    return this._state;
  }

  set(partial: Partial<IChatOverlayState>) {
    let changed = false;

    for (const key of Object.keys(partial) as (keyof IChatOverlayState)[]) {
      if (this._state[key] !== partial[key]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;

    this._state = { ...this._state, ...partial };
    this._listeners.forEach(listener => listener());
  }

  addBurst(burst: IDisintegrationBurst) {
    this.set({ bursts: [...this._state.bursts, burst] });
  }

  removeBurst(key: number) {
    this.set({ bursts: this._state.bursts.filter(b => b.key !== key) });
  }

  subscribe = (listener: () => void) => {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  };

  getSnapshot = () => this._state;
}
