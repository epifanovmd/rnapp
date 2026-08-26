import type { ListStickyEdge } from "../types";

/** Размер вьюпорта списка. */
export interface IListScrollSize {
  width: number;
  height: number;
}

/**
 * Сигналы состояния списка.
 *
 * Именованные — общие для списка, шаблонные (`containerPosition0`) — по одному
 * на контейнер: подписка адресная, поэтому смещение одного контейнера не
 * перерисовывает остальные.
 */
export interface IListSignals {
  totalSize: number;
  headerSize: number;
  footerSize: number;
  /** Верхний паддинг контента — им же компенсируется прижатие к концу. */
  stylePaddingTop: number;
  /** Распорка, прижимающая короткий контент к концу списка. */
  alignItemsAtEndPadding: number;
  /** Распорка у конца, поднимающая якорный элемент к верхней кромке. */
  anchoredEndSpaceSize: number;
  numContainers: number;
  scrollSize: IListScrollSize;
  /** Список отрисовал стартовый кадр и применил начальный скролл. */
  readyToRender: boolean;

  /** Скролл упёрся в начало контента. */
  isAtStart: boolean;
  /** Скролл упёрся в конец контента. */
  isAtEnd: boolean;
  /** Начало в пределах порога подгрузки. */
  isNearStart: boolean;
  /** Конец в пределах порога подгрузки. */
  isNearEnd: boolean;
  /** Конец в пределах порога автоприлипания — отдельный порог от подгрузки. */
  isWithinMaintainScrollAtEndThreshold: boolean;

  /**
   * Накопленная компенсация позиции.
   *
   * Ею сдвигается невидимая распорка в начале контента; нативное удержание
   * позиции видит смещение её кадра и само правит `contentOffset`.
   */
  scrollAdjust: number;
  /** Размер вьюпорта вдоль оси скролла — нужен прилипанию к конечной кромке. */
  scrollLength: number;
  /** Индекс прилипшего элемента у начальной кромки, -1 — нет. */
  activeStickyStartIndex: number;
  /** Индекс прилипшего элемента у конечной кромки, -1 — нет. */
  activeStickyEndIndex: number;
}

type ContainerSignals = {
  [K in `containerPosition${number}`]: number;
} & {
  [K in `containerItemKey${number}`]: string;
} & {
  [K in `containerItemIndex${number}`]: number;
} & {
  [K in `containerItemData${number}`]: unknown;
} & {
  [K in `containerItemSize${number}`]: number;
} & {
  /** Кромка прилипания контейнера; null — обычный элемент. */
  [K in `containerSticky${number}`]: ListStickyEdge | null;
} & {
  /** Предел смещения прилипшего элемента; undefined — не ограничен. */
  [K in `containerStickyLimit${number}`]: number | undefined;
} & {
  /** Содержимое подрезается по записанной высоте: элемент выше вьюпорта. */
  [K in `containerClipped${number}`]: boolean;
};

export type ListSignalMap = IListSignals & ContainerSignals;
export type ListSignalName = keyof ListSignalMap & string;

type Listener<TName extends ListSignalName> = (
  value: ListSignalMap[TName],
) => void;

/** Позиция контейнера, выведенного за пределы вьюпорта. */
export const POSITION_OUT_OF_VIEW = -10000000;

const INITIAL_SIGNALS: Partial<ListSignalMap> = {
  totalSize: 0,
  headerSize: 0,
  footerSize: 0,
  stylePaddingTop: 0,
  alignItemsAtEndPadding: 0,
  anchoredEndSpaceSize: 0,
  numContainers: 0,
  readyToRender: false,
  isAtStart: true,
  isAtEnd: false,
  isNearStart: true,
  isNearEnd: false,
  isWithinMaintainScrollAtEndThreshold: false,
  scrollAdjust: 0,
  scrollLength: 0,
  activeStickyStartIndex: -1,
  activeStickyEndIndex: -1,
};

/**
 * Хранилище сигналов списка.
 *
 * Значения читаются синхронно (`peek`) из расчётного цикла и подписываются
 * точечно (`listen`) из компонентов: расчёт диапазона идёт вне React, а в
 * React уходят только адресные обновления.
 */
export class ListStore {
  private readonly values = new Map<string, unknown>(
    Object.entries(INITIAL_SIGNALS),
  );
  private readonly listeners = new Map<string, Set<(value: never) => void>>();
  /** Подписки на позицию элемента по ключу — переживают смену контейнера. */
  private readonly positionListeners = new Map<
    string,
    Set<(value: number) => void>
  >();

  peek<TName extends ListSignalName>(
    name: TName,
  ): ListSignalMap[TName] | undefined {
    return this.values.get(name) as ListSignalMap[TName] | undefined;
  }

  /** Записать значение и уведомить подписчиков, если оно изменилось. */
  set<TName extends ListSignalName>(
    name: TName,
    value: ListSignalMap[TName],
  ): void {
    if (this.values.get(name) === value) return;

    this.values.set(name, value);

    const listeners = this.listeners.get(name);

    if (!listeners) return;

    for (const listener of listeners) {
      (listener as Listener<TName>)(value);
    }
  }

  listen<TName extends ListSignalName>(
    name: TName,
    listener: Listener<TName>,
  ): () => void {
    let listeners = this.listeners.get(name);

    if (!listeners) {
      listeners = new Set();
      this.listeners.set(name, listeners);
    }

    listeners.add(listener as (value: never) => void);

    return () => {
      listeners.delete(listener as (value: never) => void);
    };
  }

  listenPosition(key: string, listener: (value: number) => void): () => void {
    let listeners = this.positionListeners.get(key);

    if (!listeners) {
      listeners = new Set();
      this.positionListeners.set(key, listeners);
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  notifyPosition(key: string, value: number): void {
    const listeners = this.positionListeners.get(key);

    if (!listeners) return;

    for (const listener of listeners) {
      listener(value);
    }
  }
}
