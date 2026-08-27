import type { ComponentType, ReactElement, ReactNode } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import type Animated from "react-native-reanimated";
import type { AnimatedRef, SharedValue } from "react-native-reanimated";

/** Элемент, отданный в `renderItem`. */
export interface IListRenderItemProps<TItem> {
  item: TItem;
  index: number;
  /** Тип контейнера, вернувшийся из `getItemType`. */
  type: string;
  extraData: unknown;
  /**
   * Смещение прилипания для якорей в режиме `offset`; у остальных строк — 0.
   * Живёт на UI-потоке, применять через `useAnimatedStyle`.
   */
  stickyOffset?: SharedValue<number>;
}

/** Кромка, к которой прилипает якорь. */
export type ListStickyEdge = "start" | "end";

/**
 * Набор прилипающих элементов на одной кромке.
 *
 * `offset` — динамический отступ от кромки (навбар сверху, панель ввода и
 * клавиатура снизу), поэтому это shared value, а не число.
 */
export interface IListStickyConfig {
  edge: ListStickyEdge;
  /** Индексы якорей, по возрастанию. */
  indices: number[];
  offset?: SharedValue<number>;
  /**
   * Что именно прилипает.
   *
   * `container` — вся строка целиком (заголовки, разделители дат).
   * `offset` — строка остаётся на месте, а смещение приходит в `renderItem`
   * как shared value: ячейка применяет его к нужному узлу. Так прилипает
   * аватар группы, не утаскивая за собой сообщение.
   */
  mode?: "container" | "offset";
  /**
   * Высота прилипающего объекта в режиме `offset` — например аватара, а не
   * всей строки. От неё зависит, докуда объект поднимается: его верх не должен
   * выходить за начало своей группы. По умолчанию — высота строки.
   */
  size?: number;
  /**
   * Индекс первой строки группы для каждого якоря — параллельно `indices`.
   *
   * Задаёт границу, выше которой объект не поднимается. Без него границей
   * считается строка сразу за предыдущим якорем, а между якорями могут лежать
   * разделители и чужие сообщения — тогда аватар уезжает за пределы своей
   * группы.
   */
  groupStarts?: number[];
  /**
   * Сдвиг верхней границы группы вниз, px.
   *
   * Нужен, когда зазор между строками создаётся отступом внутри них: габариты
   * строки тогда выше видимого содержимого, и без поправки объект поднимается
   * в этот зазор.
   */
  limitInset?: number;
}

/** Удержание позиции при изменениях выше вьюпорта. */
export interface IListMaintainVisibleContentPosition<TItem> {
  /** Компенсировать вставку и удаление элементов. */
  data?: boolean;
  /** Компенсировать изменение размеров уже отрисованных элементов. */
  size?: boolean;
  /** Выбор якоря восстановления; по умолчанию — первый видимый элемент. */
  shouldRestorePosition?: (item: TItem, index: number) => boolean;
}

/** Автоприлипание к концу списка при добавлении элементов. */
export interface IListMaintainScrollAtEnd {
  /** Прилипать только если пользователь уже у конца. */
  onlyWhenAtEnd?: boolean;
  animated?: boolean;
}

/** Распорка у конца списка, растущая до якоря. */
export interface IListAnchoredEndSpace {
  anchorIndex: number;
  /** Дополнительный отступ над якорем. */
  anchorOffset?: number;
  /** Верхняя граница размера распорки. */
  maxSize?: number;
  onSizeChanged?: (size: number) => void;
}

/** Стартовая позиция скролла. */
export type ListInitialScroll =
  | { type: "end" }
  | { type: "offset"; offset: number }
  | {
      type: "index";
      index: number;
      viewPosition?: number;
      viewOffset?: number;
    };

/** Порог видимости элемента. */
export interface IListViewabilityConfig {
  id?: string;
  /** Доля видимой части элемента, при которой он считается видимым. */
  itemVisiblePercentThreshold?: number;
  /** Доля вьюпорта, занятая элементом. */
  viewAreaCoveragePercentThreshold?: number;
  /** Сколько элемент должен пробыть видимым, мс. */
  minimumViewTime?: number;
}

export interface IListViewToken<TItem> {
  item: TItem;
  key: string;
  index: number;
  isViewable: boolean;
}

export interface IListViewabilityCallbackInfo<TItem> {
  viewableItems: IListViewToken<TItem>[];
  changed: IListViewToken<TItem>[];
}

export interface IListViewabilityPair<TItem> {
  config: IListViewabilityConfig;
  onViewableItemsChanged: (info: IListViewabilityCallbackInfo<TItem>) => void;
}

/** Shared values, которые список публикует наружу для worklet-логики. */
export interface IListSharedValues {
  /** Смещение скролла в координатах контента. */
  scrollOffset?: SharedValue<number>;
  /** Индекс активного якоря начальной кромки, -1 если якорей нет. */
  activeStickyStartIndex?: SharedValue<number>;
  /** Индекс активного якоря конечной кромки, -1 если якорей нет. */
  activeStickyEndIndex?: SharedValue<number>;
  /** Пользователь у конца списка в пределах порога. */
  isNearEnd?: SharedValue<boolean>;
}

/** Императивный интерфейс списка. */
export interface IListRef {
  scrollToIndex: (params: {
    index: number;
    animated?: boolean;
    viewPosition?: number;
    viewOffset?: number;
  }) => void;
  scrollToOffset: (params: { offset: number; animated?: boolean }) => void;
  scrollToEnd: (params?: { animated?: boolean }) => void;
  /** Позиция элемента в координатах контента; undefined — размер ещё не известен. */
  getPositionAtIndex: (index: number) => number | undefined;
  /** Текущий видимый диапазон и его буферизованные границы. */
  getVisibleRange: () => {
    start: number;
    end: number;
    startBuffered: number;
    endBuffered: number;
  };
  /** Смещение скролла в координатах контента. */
  getScrollOffset: () => number;
}

export interface IListProps<TItem> {
  data: readonly TItem[];
  renderItem: (props: IListRenderItemProps<TItem>) => ReactNode;
  keyExtractor: (item: TItem, index: number) => string;

  /**
   * Тип контейнера для переиспользования: контейнер того же типа уже держит
   * нужное поддерево, поэтому React меняет пропы вместо перемонтирования.
   */
  getItemType?: (item: TItem, index: number) => string;
  /** Известный размер элемента — измерение пропускается. */
  getFixedItemSize?: (
    item: TItem,
    index: number,
    type: string,
  ) => number | undefined;
  /** Стартовая оценка размера до первого измерения. */
  estimatedItemSize: number;
  /** Переиспользовать смонтированные контейнеры вместо перемонтирования. */
  recycleItems?: boolean;
  /** Сравнение элементов для пропуска повторного рендера ячейки. */
  itemsAreEqual?: (prev: TItem, next: TItem, index: number) => boolean;
  extraData?: unknown;

  /** Запас отрисовки за пределами вьюпорта, px. */
  drawDistance?: number;

  ListHeaderComponent?: ComponentType<unknown> | ReactElement | null;
  ListFooterComponent?: ComponentType<unknown> | ReactElement | null;
  ListEmptyComponent?: ComponentType<unknown> | ReactElement | null;
  ItemSeparatorComponent?: ComponentType<unknown> | null;

  /** Прижать контент к концу, когда он короче вьюпорта. */
  alignItemsAtEnd?: boolean;
  anchoredEndSpace?: IListAnchoredEndSpace;
  maintainVisibleContentPosition?: IListMaintainVisibleContentPosition<TItem>;
  maintainScrollAtEnd?: IListMaintainScrollAtEnd;
  /** Порог «у конца» для `maintainScrollAtEnd` и `isNearEnd`, px. */
  maintainScrollAtEndThreshold?: number;
  initialScroll?: ListInitialScroll;

  /** Наборы прилипающих элементов; на каждой кромке не более одного. */
  sticky?: IListStickyConfig[];
  /** Точки притяжения скролла. */
  snapToIndices?: number[];

  /**
   * Нижний отступ индикатора скролла.
   *
   * Место под панелью ввода отдаётся списку распоркой в подвале: она часть
   * контента, а индикатор живёт в координатах `ScrollView` и о ней не знает —
   * без этого отступа он доходит до кромки экрана, тогда как контент
   * останавливается над панелью. Значение — высота той же распорки, поэтому
   * это shared value: оно меняется вместе с клавиатурой.
   *
   * iOS сам добавляет safe area к инсетам индикатора; здесь она уже входит в
   * значение, поэтому авто-подстройка отключается — иначе отступ был бы двойным.
   */
  scrollIndicatorInset?: SharedValue<number>;

  viewabilityPairs?: IListViewabilityPair<TItem>[];
  sharedValues?: IListSharedValues;

  onStartReached?: (info: { distanceFromStart: number }) => void;
  onStartReachedThreshold?: number;
  onEndReached?: (info: { distanceFromEnd: number }) => void;
  onEndReachedThreshold?: number;
  /** Первая раскладка завершена, стартовый скролл применён. */
  onLoad?: () => void;

  /** Размер вьюпорта изменился. */
  onLayout?: (event: LayoutChangeEvent) => void;
  /** Размер контента изменился. */
  onContentSizeChange?: (width: number, height: number) => void;
  /** Палец лёг на экран: внешняя логика позиции обязана уступить жесту. */
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: () => void;

  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Ref нижележащего ScrollView. Нужен тем, кто двигает позицию с UI-потока —
   * например компенсации клавиатуры.
   */
  refScrollView?: AnimatedRef<Animated.ScrollView>;
}
