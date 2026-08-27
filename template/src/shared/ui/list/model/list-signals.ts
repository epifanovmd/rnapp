import type { ListStickyEdge } from "../types";

/** Размер вьюпорта списка. */
export interface IListScrollSize {
  width: number;
  height: number;
}

/**
 * Именованные сигналы состояния списка — общие для всего списка.
 *
 * Зачем нужны: расчётное ядро живёт вне React, а дереву нужно узнавать о его
 * решениях. Сигнал — самая узкая связь между ними: подписка адресная, поэтому
 * изменение одного значения перерисовывает только тех, кто именно его и читал.
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

/**
 * Шаблонные сигналы — по одному набору на контейнер.
 *
 * Адресность здесь и есть весь смысл: смещение одного контейнера при скролле не
 * должно перерисовывать остальные, поэтому у каждого свой сигнал позиции, а не
 * общий массив.
 */
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
  /** Содержимое подрезается по записанной высоте: элемент вне вьюпорта. */
  [K in `containerClipped${number}`]: boolean;
};

export type ListSignalMap = IListSignals & ContainerSignals;
export type ListSignalName = keyof ListSignalMap & string;

/**
 * Позиция контейнера, выведенного за пределы вьюпорта.
 *
 * Контейнер без привязки не размонтируется — он ждёт следующего элемента, —
 * поэтому его просто уводят туда, куда скролл не доходит.
 */
export const POSITION_OUT_OF_VIEW = -10000000;

/** Значения сигналов до первой раскладки. */
export const INITIAL_SIGNALS: Partial<ListSignalMap> = {
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
