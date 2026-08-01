import { makeMutable, SharedValue } from "react-native-reanimated";

/**
 * Внешний стор оверлеев (FAB, плавающая дата, empty state, распад) —
 * позволяет обновлять их при скролле без ре-рендера корня и списка.
 *
 * Подписываться на стор целиком нельзя: значения обновляются на каждом кадре
 * скролла, и общий снимок перерисовывал бы все четыре оверлея сразу.
 * Потребители читают отдельные поля через `useOverlayValue`, а величины,
 * меняющиеся покадрово (сдвиг плашки даты), живут в shared value и до React
 * вообще не доходят.
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
  emptyVisible: false,
  emptyLoading: false,
  emptyText: null,
  bursts: [],
};

export class ChatOverlayStore {
  private _state: IChatOverlayState = INITIAL_STATE;
  private readonly _listeners = new Set<() => void>();

  /**
   * Сдвиг плашки даты вверх, когда её подпирает следующий разделитель.
   * Считается на каждом кадре скролла, поэтому не состояние, а shared value:
   * плашка следует за разделителем на UI-потоке и без единого ре-рендера.
   */
  readonly floatingDatePush: SharedValue<number> = makeMutable(0);

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
