import type { ComponentType, ReactElement, ReactNode } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import type Animated from "react-native-reanimated";
import type { AnimatedRef, SharedValue } from "react-native-reanimated";

import type { ListState } from "./model";

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
  /**
   * Прилипшую копию рисует слой поверх списка: узел, к которому применяется
   * {@link stickyOffset}, нужно спрятать, оставив на месте для касаний.
   */
  stickyPinned?: SharedValue<boolean>;
}

/** Размер вьюпорта списка. */
export interface IListScrollSize {
  width: number;
  height: number;
}

/** Кромка, к которой прилипает якорь. */
export type ListStickyEdge = "start" | "end";

/**
 * Набор прилипающих элементов на одной кромке.
 *
 * `offset` — динамический отступ от кромки (навбар сверху, панель ввода и
 * клавиатура снизу), поэтому это shared value, а не число.
 */
export interface IListStickyConfig<TItem = unknown> {
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
  /**
   * Прилипшая копия якоря для слоя поверх списка.
   *
   * Пока якорь стоит у кромки, его экранная позиция постоянна — и рисует его
   * отдельный слой, которому не нужен покадровый трансформ. Внутри контента
   * якорь в этот момент прячется, оставаясь на месте для касаний.
   *
   * В режиме `container` по умолчанию берётся `renderItem`: прилипшая копия —
   * это сама строка. В режиме `offset` копию обязан задать вызывающий: у
   * кромки стоит не строка, а объект внутри неё — аватар группы.
   */
  renderOverlay?: (item: TItem, index: number) => ReactNode;
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

/**
 * Shared values, которые список публикует наружу для worklet-логики.
 *
 * Всё, что список знает о своём состоянии, доступно на UI-потоке: заполните
 * только те поля, которые нужны, — остальные не стоят ничего. Не публикуются
 * лишь внутренности собственной механики (компенсация позиции, число
 * контейнеров, сигналы отдельных контейнеров): опираться на них снаружи нельзя.
 */
export interface IListSharedValues {
  /** Смещение скролла в координатах контента. */
  scrollOffset?: SharedValue<number>;

  /** Палец на экране: позицией управляет жест. */
  isDragging?: SharedValue<boolean>;
  /**
   * Идёт инерция после броска.
   *
   * «Список движется» — это `isDragging || isMomentum`. Отдельного признака
   * нет намеренно: программный скролл не порождает ни того, ни другого, и
   * склеенный флаг врал бы про него молча.
   */
  isMomentum?: SharedValue<boolean>;
  /** Скорость скролла, px/мс: положительная — к концу списка. */
  velocity?: SharedValue<number>;

  /** Суммарная высота элементов, без шапки, подвала и распорок. */
  totalSize?: SharedValue<number>;
  /** Полная высота контента: элементы плюс шапка, подвал и распорки. */
  contentSize?: SharedValue<number>;
  /** Граница скролла; вместе со смещением даёт прогресс прокрутки. */
  maxScroll?: SharedValue<number>;
  /** Размер вьюпорта вдоль оси скролла. */
  scrollLength?: SharedValue<number>;
  /** Размер вьюпорта целиком. */
  scrollSize?: SharedValue<IListScrollSize>;
  headerSize?: SharedValue<number>;
  footerSize?: SharedValue<number>;
  /** Распорка, прижимающая короткий контент к концу списка. */
  alignItemsAtEndPadding?: SharedValue<number>;
  /** Распорка у конца, поднимающая якорный элемент к верхней кромке. */
  anchoredEndSpaceSize?: SharedValue<number>;

  /** Список отрисовал стартовый кадр и применил начальный скролл. */
  readyToRender?: SharedValue<boolean>;

  /** Скролл упёрся в начало контента. */
  isAtStart?: SharedValue<boolean>;
  /** Скролл упёрся в конец контента. */
  isAtEnd?: SharedValue<boolean>;
  /** Начало в пределах порога подгрузки. */
  isNearStart?: SharedValue<boolean>;
  /** Конец в пределах порога подгрузки. */
  isNearEnd?: SharedValue<boolean>;
  /**
   * Конец в пределах порога автоприлипания.
   *
   * Порог здесь свой, отдельный от подгрузки: «у низа» для кнопки возврата и
   * «пора подгружать» — разные расстояния.
   */
  isWithinMaintainScrollAtEndThreshold?: SharedValue<boolean>;
  /** Расстояние до начала контента — для плавных эффектов, а не флагов. */
  distanceFromStart?: SharedValue<number>;
  /** Расстояние до конца контента, без учёта отступа конца. */
  distanceFromEnd?: SharedValue<number>;

  /** Первый элемент, пересёкший вьюпорт; -1 — видимых нет. */
  firstVisibleIndex?: SharedValue<number>;
  /** Последний элемент, пересёкший вьюпорт; -1 — видимых нет. */
  lastVisibleIndex?: SharedValue<number>;

  /** Индекс активного якоря начальной кромки, -1 если якорей нет. */
  activeStickyStartIndex?: SharedValue<number>;
  /** Индекс активного якоря конечной кромки, -1 если якорей нет. */
  activeStickyEndIndex?: SharedValue<number>;
}

/** Императивный интерфейс списка. */
export interface IListRef {
  scrollToIndex: (params: {
    index: number;
    animated?: boolean;
    viewPosition?: number;
    viewOffset?: number;
  }) => void;
  /**
   * Скролл к элементу по ключу.
   *
   * Ключ переживает вставки и удаления, а индекс — нет: после подгрузки сверху
   * тот же элемент лежит на другом индексе.
   *
   * @returns false, если элемента с таким ключом в данных нет.
   */
  scrollToKey: (params: {
    key: string;
    animated?: boolean;
    viewPosition?: number;
    viewOffset?: number;
  }) => boolean;
  scrollToOffset: (params: { offset: number; animated?: boolean }) => void;
  scrollToEnd: (params?: { animated?: boolean }) => void;
  /** Позиция элемента в координатах контента; undefined — индекс вне данных. */
  getPositionAtIndex: (index: number) => number | undefined;
  /** Размер элемента; до измерения — оценка, а не факт. */
  getSizeAtIndex: (index: number) => number | undefined;
  /** Позиция элемента по ключу; undefined — ключа нет в данных. */
  getPositionByKey: (key: string) => number | undefined;
  /** Индекс элемента по ключу; undefined — ключа нет в данных. */
  getIndexByKey: (key: string) => number | undefined;
  /** Текущий видимый диапазон и его буферизованные границы. */
  getVisibleRange: () => {
    start: number;
    end: number;
    startBuffered: number;
    endBuffered: number;
  };
  /** Смещение скролла в координатах контента. */
  getScrollOffset: () => number;
  /** Полная высота контента: элементы плюс шапка, подвал и распорки. */
  getContentSize: () => number;
  /** Размер вьюпорта вдоль оси скролла. */
  getScrollLength: () => number;
  /** Скорость скролла, px/мс: положительная — к концу списка. */
  getVelocity: () => number;
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
  sticky?: IListStickyConfig<TItem>[];
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
  /** Состояние списка на UI-потоке: анимации без единого рендера. */
  sharedValues?: IListSharedValues;
  /**
   * Состояние списка для JS: подписка с перерисовкой.
   *
   * Создаётся через `useListState()` вне списка и читается через
   * `useListValue(state, name)` — в том числе из соседних компонентов, которым
   * список недоступен. Для анимаций используйте `sharedValues`.
   */
  state?: ListState;

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
