import type { IContainerRequest } from "../model";
import {
  ContainerPool,
  ListMetrics,
  ListStore,
  POSITION_OUT_OF_VIEW,
} from "../model";
import type {
  IListAnchoredEndSpace,
  IListStickyConfig,
  IListViewabilityPair,
  ListInitialScroll,
  ListStickyEdge,
} from "../types";
import type { ListEdge } from "./edge-thresholds";
import { EdgeThresholds } from "./edge-thresholds";
import { InitialScroll } from "./initial-scroll";
import { listDebug } from "./list-debug";
import type { IScrollAdapter } from "./maintain-scroll-at-end";
import { MaintainScrollAtEnd } from "./maintain-scroll-at-end";
import { ScrollVelocityTracker } from "./scroll-velocity";
import { StickyAnchors } from "./sticky-anchors";
import { ViewabilityTracker } from "./viewability";
import { VisibleAnchor } from "./visible-anchor";

/** Пропы, влияющие на расчёт раскладки и поведение скролла. */
export interface IListRuntimeProps<TItem> {
  data: readonly TItem[];
  keyExtractor: (item: TItem, index: number) => string;
  getItemType?: (item: TItem, index: number) => string;
  getFixedItemSize?: (
    item: TItem,
    index: number,
    type: string,
  ) => number | undefined;
  estimatedItemSize: number;
  drawDistance: number;

  /** Доли длины вьюпорта. */
  startReachedThreshold: number;
  endReachedThreshold: number;
  maintainScrollAtEndThreshold: number;
  maintainScrollAtEnd: boolean;
  maintainScrollAtEndAnimated: boolean;

  /** Компенсировать вставку и удаление элементов выше вьюпорта. */
  maintainVisibleContentPositionData: boolean;
  /** Компенсировать изменение размеров уже отрисованных элементов. */
  maintainVisibleContentPositionSize: boolean;
  /** Разрешён ли элемент как якорь восстановления. */
  shouldRestorePosition?: (index: number) => boolean;
  /** Прижимать контент к концу, когда он короче вьюпорта. */
  alignItemsAtEnd: boolean;
  /** Стартовая позиция скролла. */
  initialScroll?: ListInitialScroll;
  /** Распорка у конца, поднимающая якорный элемент к верхней кромке. */
  anchoredEndSpace?: IListAnchoredEndSpace;
  /** Наборы прилипающих элементов по кромкам. */
  sticky?: IListStickyConfig[];
  /** Пары «условие видимости — колбэк». */
  viewabilityPairs?: IListViewabilityPair<TItem>[];
  /** Первая раскладка завершена и начальный скролл применён. */
  onLoad?: () => void;

  onStartReached?: (info: { distanceFromStart: number }) => void;
  onEndReached?: (info: { distanceFromEnd: number }) => void;
}

/** Видимый диапазон и его буферизованные границы. */
export interface IListRange {
  start: number;
  end: number;
  startBuffered: number;
  endBuffered: number;
}

const DEFAULT_ITEM_TYPE = "";
/** Сколько ждать завершения анимированного программного скролла, мс. */
const PROGRAMMATIC_SCROLL_SETTLE_MS = 500;
/** Сколько удерживать прежнюю высоту контента при её уменьшении, мс. */
const HOLD_CONTENT_SIZE_MS = 16;

/**
 * Расчётное ядро списка.
 *
 * Живёт вне React: диапазон, позиции и привязка контейнеров считаются здесь,
 * а в дерево уходят только адресные сигналы стора. Скролл и измерения не
 * перерисовывают список целиком — перерисовывается только затронутый контейнер.
 */
export class ListRuntime<TItem> {
  readonly store: ListStore;
  readonly metrics: ListMetrics;
  readonly pool = new ContainerPool();

  private props: IListRuntimeProps<TItem>;
  private keys: string[] = [];
  private types: string[] = [];

  /** Смещение скролла в координатах контента. */
  private scroll = 0;
  /** Размер вьюпорта вдоль оси скролла. */
  private scrollLength = 0;

  private range: IListRange = {
    start: 0,
    end: -1,
    startBuffered: 0,
    endBuffered: -1,
  };

  private readonly velocity = new ScrollVelocityTracker();
  private readonly edges: EdgeThresholds;
  private readonly maintainAtEnd: MaintainScrollAtEnd;
  private readonly anchor: VisibleAnchor;
  private readonly sticky: StickyAnchors;
  private readonly viewability: ViewabilityTracker<TItem>;

  /** Измерения копятся до конца кадра и применяются одним проходом. */
  private pendingFlush = false;
  /** Якорь уже снят для текущей пачки изменений. */
  private anchorCaptured = false;

  private readonly initialScroll: InitialScroll;
  /** Цель прошлой попытки начального скролла — по ней видно, что позиция устаканилась. */
  private lastInitialOffset: number | undefined;

  private adapter: IScrollAdapter | undefined;
  /** Кромка, разблокированная текущим жестом. */
  private allowedEdge: ListEdge | undefined;
  /** Контейнеры уже прошли первую раскладку — до этого прилипать не к чему. */
  private didLayout = false;
  /** Идёт программный скролл: пороги кромок в это время не проверяются. */
  private scrollingTo = false;
  /** Накопленная компенсация позиции. */
  private scrollAdjust = 0;

  constructor(store: ListStore, props: IListRuntimeProps<TItem>) {
    this.store = store;
    this.props = props;
    this.metrics = new ListMetrics({
      estimatedItemSize: props.estimatedItemSize,
    });

    this.edges = new EdgeThresholds(this.edgeOptions());
    this.maintainAtEnd = new MaintainScrollAtEnd(this.maintainOptions());
    this.sticky = new StickyAnchors({ metrics: this.metrics });
    this.sticky.setConfigs(props.sticky);
    this.viewability = new ViewabilityTracker<TItem>({
      metrics: this.metrics,
      getItem: index => this.props.data[index],
    });
    this.viewability.setPairs(props.viewabilityPairs);
    this.anchor = new VisibleAnchor({
      metrics: this.metrics,
      shouldRestorePosition: index =>
        props.shouldRestorePosition?.(index) ?? true,
    });

    this.initialScroll = new InitialScroll({
      target: props.initialScroll,
      resolveOffset: () => this.resolveInitialOffset(),
      scrollToOffset: offset => this.adapter?.scrollToOffset(offset, false),
      isTargetSettled: () => this.isInitialOffsetSettled(),
      onFinished: () => {
        this.store.set("readyToRender", true);
        this.props.onLoad?.();
      },
    });

    this.applyData(props.data);
  }

  /** Смещение стартовой позиции; undefined — вьюпорт ещё не измерен. */
  private resolveInitialOffset(): number | undefined {
    const target = this.props.initialScroll;

    if (!target || this.scrollLength === 0) return undefined;

    if (target.type === "offset") return Math.max(0, target.offset);

    if (target.type === "end") {
      return Math.max(0, this.metrics.getTotalSize() - this.scrollLength);
    }

    const position = this.getPositionAtIndex(target.index);

    if (position === undefined) return undefined;

    const { viewPosition = 0, viewOffset = 0 } = target;
    const itemSize = this.metrics.getSize(target.index);

    return Math.max(
      0,
      position - viewPosition * (this.scrollLength - itemSize) - viewOffset,
    );
  }

  /** Цель перестала уезжать между кадрами — размеры устаканились. */
  private isInitialOffsetSettled(): boolean {
    const offset = this.resolveInitialOffset();
    const settled = offset !== undefined && offset === this.lastInitialOffset;

    this.lastInitialOffset = offset;

    return settled;
  }

  private edgeOptions() {
    return {
      store: this.store,
      startThreshold: this.props.startReachedThreshold,
      endThreshold: this.props.endReachedThreshold,
      maintainScrollAtEndThreshold: this.props.maintainScrollAtEndThreshold,
      onStartReached: this.props.onStartReached,
      onEndReached: this.props.onEndReached,
    };
  }

  private maintainOptions() {
    return {
      store: this.store,
      adapter: () => this.adapter,
      enabled: this.props.maintainScrollAtEnd,
      animated: this.props.maintainScrollAtEndAnimated,
    };
  }

  /** Привязка к нативному скроллу; вызывается при монтировании списка. */
  setAdapter(adapter: IScrollAdapter | undefined): void {
    this.adapter = adapter;
  }

  getRange(): IListRange {
    return this.range;
  }

  getItemAt(index: number): TItem | undefined {
    return this.props.data[index];
  }

  getScroll(): number {
    return this.scroll;
  }

  getScrollLength(): number {
    return this.scrollLength;
  }

  /** Обновление пропов между рендерами; данные пересобирают ключи и типы. */
  setProps(props: IListRuntimeProps<TItem>): void {
    const dataChanged = props.data !== this.props.data;

    this.props = props;
    this.edges.setOptions(this.edgeOptions());
    this.maintainAtEnd.setOptions(this.maintainOptions());
    this.sticky.setConfigs(props.sticky);
    this.viewability.setPairs(props.viewabilityPairs);

    if (!dataChanged) return;

    // Якорь снимается до смены данных — по позициям старой раскладки.
    if (props.maintainVisibleContentPositionData) this.captureAnchorOnce();

    this.applyData(props.data);
    this.calculateItemsInView();

    if (props.maintainVisibleContentPositionData) {
      this.anchorCaptured = false;
      this.applyAnchorShift();
    }

    this.updateAlignItemsAtEndPadding();
    this.updateAnchoredEndSpace();
    this.checkThresholds();

    // Новый контент удлинил список: если пользователь стоял у конца, держим его там.
    if (this.didLayout) this.maintainAtEnd.run();
  }

  /**
   * Распорка у конца списка.
   *
   * Резервирует место так, чтобы якорный элемент мог подняться к верхней кромке
   * вьюпорта, даже когда контента под ним не хватает. Входит в отступ конца,
   * поэтому расстояние до кромки для порогов считается без неё — иначе
   * подгрузка срабатывала бы на пустом месте.
   */
  private updateAnchoredEndSpace(): void {
    const config = this.props.anchoredEndSpace;

    if (!config) return;

    const anchorPosition = this.getPositionAtIndex(config.anchorIndex);

    if (anchorPosition === undefined) return;

    const { anchorOffset = 0, maxSize } = config;
    const contentBelowAnchor = this.metrics.getTotalSize() - anchorPosition;
    const needed = Math.max(
      0,
      this.scrollLength - contentBelowAnchor - anchorOffset,
    );
    const size = maxSize === undefined ? needed : Math.min(needed, maxSize);

    if (size === (this.store.peek("anchoredEndSpaceSize") ?? 0)) return;

    this.store.set("anchoredEndSpaceSize", size);
    config.onSizeChanged?.(size);
  }

  /**
   * Распорка, прижимающая короткий контент к концу списка.
   *
   * При уменьшении распорки суммарная высота удерживается на кадр: иначе
   * ScrollView сожмёт контент раньше, чем разложены новые позиции, и скролл
   * дёрнется.
   */
  private updateAlignItemsAtEndPadding(): void {
    if (!this.props.alignItemsAtEnd) return;

    const previous = this.store.peek("alignItemsAtEndPadding") ?? 0;
    const next = Math.max(0, this.scrollLength - this.metrics.getTotalSize());

    if (next === previous) return;

    if (next < previous) {
      const held = (this.store.peek("totalSize") ?? 0) + previous;

      this.store.set("totalSize", held);

      setTimeout(() => {
        this.store.set("totalSize", this.metrics.getTotalSize() + next);
      }, HOLD_CONTENT_SIZE_MS);
    }

    this.store.set("alignItemsAtEndPadding", next);
  }

  private applyData(data: readonly TItem[]): void {
    const { keyExtractor, getItemType, getFixedItemSize } = this.props;

    this.keys = new Array<string>(data.length);
    this.types = new Array<string>(data.length);

    for (let index = 0; index < data.length; index++) {
      const item = data[index]!;
      const key = keyExtractor(item, index);
      const type = getItemType?.(item, index) ?? DEFAULT_ITEM_TYPE;

      this.keys[index] = key;
      this.types[index] = type;

      const fixedSize = getFixedItemSize?.(item, index, type);

      if (fixedSize !== undefined) this.metrics.setFixedSize(key, fixedSize);
    }

    this.metrics.setItems(this.keys, this.types);
  }

  /** Новый размер вьюпорта. */
  setScrollLength(length: number): void {
    if (this.scrollLength === length) return;

    this.scrollLength = length;
    this.store.set("scrollLength", length);
    this.calculateItemsInView();
    this.updateAlignItemsAtEndPadding();
    this.updateAnchoredEndSpace();
    this.checkThresholds();
    this.didLayout = true;
    this.initialScroll.apply();
  }

  /** Новое смещение скролла. */
  setScroll(offset: number): void {
    if (this.scroll === offset) return;

    const previous = this.scroll;

    this.scroll = offset;
    this.velocity.add(offset);

    listDebug("scroll", "setScroll", {
      from: previous,
      to: offset,
      delta: offset - previous,
    });

    this.calculateItemsInView();
    this.checkThresholds();
  }

  getVelocity(): number {
    return this.velocity.get();
  }

  /** Начало жеста: направление решает, какая кромка может сработать снова. */
  onGestureBegin(): void {
    this.allowedEdge = this.edges.beginGesture(this.velocity.get());
  }

  /** Жест завершён — следующий разблокирует кромку. */
  onGestureEnd(): void {
    this.edges.prepareForNextGesture();
    this.allowedEdge = undefined;
  }

  private checkThresholds(): void {
    this.edges.check(
      {
        scroll: this.scroll,
        scrollLength: this.scrollLength,
        contentSize: this.metrics.getTotalSize(),
        dataLength: this.props.data.length,
        contentInsetEnd: this.store.peek("anchoredEndSpaceSize") ?? 0,
        skipCallbacks:
          this.scrollingTo ||
          this.maintainAtEnd.isActive() ||
          this.initialScroll.isActive(),
      },
      this.allowedEdge,
    );
  }

  /** Позиция элемента в координатах контента. */
  getPositionAtIndex(index: number): number | undefined {
    if (index < 0 || index >= this.keys.length) return undefined;

    return this.metrics.getPosition(index);
  }

  scrollToOffset(offset: number, animated = false): void {
    this.scrollingTo = true;
    this.adapter?.scrollToOffset(offset, animated);
    this.settleProgrammaticScroll(animated);
  }

  scrollToEnd(animated = false): void {
    this.scrollingTo = true;
    this.adapter?.scrollToEnd(animated);
    this.settleProgrammaticScroll(animated);
  }

  /**
   * Скролл к элементу. `viewPosition` — куда прижать элемент во вьюпорте:
   * 0 к началу, 1 к концу, 0.5 по центру.
   */
  scrollToIndex(params: {
    index: number;
    animated?: boolean;
    viewPosition?: number;
    viewOffset?: number;
  }): void {
    const {
      index,
      animated = false,
      viewPosition = 0,
      viewOffset = 0,
    } = params;
    const position = this.getPositionAtIndex(index);

    if (position === undefined) return;

    const itemSize = this.metrics.getSize(index);
    const offset =
      position - viewPosition * (this.scrollLength - itemSize) - viewOffset;

    this.scrollToOffset(Math.max(0, offset), animated);
  }

  private settleProgrammaticScroll(animated: boolean): void {
    if (!animated) {
      this.scrollingTo = false;

      return;
    }

    setTimeout(() => {
      this.scrollingTo = false;
    }, PROGRAMMATIC_SCROLL_SETTLE_MS);
  }

  /**
   * Результат измерения ячейки.
   *
   * Измерения копятся до конца кадра: при первом наполнении списка их приходят
   * десятки подряд, и пересчёт на каждое стоил бы столько же проходов. Якорь
   * снимается до применения первого размера — по старой раскладке.
   */
  setItemSize(key: string, size: number): void {
    this.captureAnchorOnce();

    const previous = this.metrics.getSizeByKey(key);

    if (!this.metrics.setMeasuredSize(key, size)) return;

    listDebug("size", "измерено", {
      key,
      from: previous ?? -1,
      to: size,
      delta: size - (previous ?? size),
    });

    this.scheduleFlush();
  }

  private captureAnchorOnce(): void {
    if (this.anchorCaptured) return;

    this.anchor.capture(this.range.start, this.range.end);
    this.anchorCaptured = true;
  }

  private scheduleFlush(): void {
    if (this.pendingFlush) return;

    this.pendingFlush = true;
    requestAnimationFrame(() => this.flushLayout());
  }

  /** Применение накопленных изменений раскладки одним проходом. */
  private flushLayout(): void {
    this.pendingFlush = false;
    this.anchorCaptured = false;

    this.calculateItemsInView();

    if (this.props.maintainVisibleContentPositionSize) this.applyAnchorShift();

    this.updateAlignItemsAtEndPadding();
    this.updateAnchoredEndSpace();
    this.checkThresholds();
    this.initialScroll.apply();

    if (this.didLayout) this.maintainAtEnd.run();
  }

  /**
   * Компенсация смещения якоря.
   *
   * Сам сдвиг выполняет нативный ScrollView — ему передан
   * `maintainVisibleContentPosition`. Здесь только приводится внутреннее
   * представление о позиции, чтобы диапазон отрисовки не отставал до прихода
   * события скролла: трогать нативный скролл во время жеста нельзя, это его
   * прерывает.
   */
  /**
   * Компенсация того, насколько уехал якорь.
   *
   * Программного скролла здесь нет: он обрывает жест и инерцию, а подгрузка
   * сверху догоняет пользователя как раз на них. Вместо этого сдвигается
   * невидимая распорка в начале контента — нативное удержание позиции следит
   * именно за ней и повторяет сдвиг на `contentOffset` изнутри.
   *
   * Собственное представление о позиции сдвигается сразу: событие о нативном
   * сдвиге придёт позже, а диапазон отрисовки нужен уже в этом кадре.
   */
  private applyAnchorShift(): void {
    const shift = this.anchor.measureShift();

    if (shift === 0) return;

    this.scroll = Math.max(0, this.scroll + shift);
    this.scrollAdjust += shift;
    this.store.set("scrollAdjust", this.scrollAdjust);

    listDebug("anchor", "компенсация", {
      shift,
      scroll: this.scroll,
      adjust: this.scrollAdjust,
    });

    this.calculateItemsInView();
  }

  /**
   * Диапазон отрисовки и привязка контейнеров.
   *
   * Буфер по обе стороны вьюпорта задаётся `drawDistance`: элементы за кромкой
   * уже смонтированы и измерены к моменту, когда до них доходит скролл.
   */
  calculateItemsInView(): void {
    const count = this.keys.length;
    const { drawDistance } = this.props;

    if (count === 0) {
      this.range = { start: 0, end: -1, startBuffered: 0, endBuffered: -1 };
      this.releaseAll();
      this.store.set("totalSize", 0);

      return;
    }

    this.metrics.flush();

    const scrollTop = this.scroll;
    const scrollBottom = scrollTop + this.scrollLength;
    const bufferedTop = scrollTop - drawDistance;
    const bufferedBottom = scrollBottom + drawDistance;

    const startBuffered = this.metrics.findIndexAtOffset(
      Math.max(0, bufferedTop),
    );
    let endBuffered = startBuffered;
    let start = -1;
    let end = -1;

    for (let index = startBuffered; index < count; index++) {
      const position = this.metrics.getPosition(index);

      if (position > bufferedBottom) break;

      endBuffered = index;

      const itemBottom = position + this.metrics.getSize(index);

      if (itemBottom > scrollTop && position < scrollBottom) {
        if (start === -1) start = index;
        end = index;
      }
    }

    // Ни один элемент не пересёк вьюпорт — видимый диапазон пуст, буфер остаётся.
    this.range =
      start === -1
        ? {
            start: startBuffered,
            end: startBuffered - 1,
            startBuffered,
            endBuffered,
          }
        : { start, end, startBuffered, endBuffered };

    listDebug("range", "диапазон", {
      scroll: scrollTop,
      start,
      end,
      startBuffered,
      endBuffered,
      total: this.metrics.getTotalSize(),
    });

    this.bindContainers(startBuffered, endBuffered);
    this.store.set("totalSize", this.metrics.getTotalSize());

    if (this.viewability.hasPairs()) {
      this.viewability.update({
        scroll: scrollTop,
        scrollLength: this.scrollLength,
        startBuffered,
        endBuffered,
      });
    }
  }

  /**
   * Активные якоря кромок.
   *
   * Прилипший элемент и его соседи держатся смонтированными, даже когда уехали
   * за буфер отрисовки: иначе прилипшая шапка исчезала бы, стоило её группе
   * выйти за кромку.
   */
  private resolveSticky(): number[] {
    if (!this.sticky.hasAnchors()) {
      this.store.set("activeStickyStartIndex", -1);
      this.store.set("activeStickyEndIndex", -1);

      return [];
    }

    const states = this.sticky.resolve(this.scroll, this.scrollLength);

    for (const state of states) {
      const signal =
        state.edge === "start"
          ? "activeStickyStartIndex"
          : "activeStickyEndIndex";
      const previous = this.store.peek(signal);

      if (previous !== state.activeIndex) {
        listDebug("sticky", "смена якоря", {
          edge: state.edge,
          from: previous ?? -1,
          to: state.activeIndex,
          limit: state.limit ?? -1,
        });
      }

      this.store.set(signal, state.activeIndex);
    }

    return this.sticky.getPinnedIndices(states);
  }

  /** Привязка контейнеров к элементам диапазона и раскладка их позиций. */
  private bindContainers(startBuffered: number, endBuffered: number): void {
    const pinned = this.resolveSticky();
    const requests: IContainerRequest[] = [];
    const requested = new Set<number>();

    const addRequest = (index: number) => {
      const key = this.keys[index];

      if (key === undefined || requested.has(index)) return;

      requested.add(index);
      requests.push({
        index,
        key,
        type: this.types[index] ?? DEFAULT_ITEM_TYPE,
        stickyEdge: this.sticky.getEdgeOf(index),
      });
    };

    for (let index = startBuffered; index <= endBuffered; index++)
      addRequest(index);

    // Прилипшие якоря держатся смонтированными и за пределами буфера.
    for (const index of pinned) addRequest(index);

    const { changed, released, count } = this.pool.allocate(requests);

    for (const id of released) {
      this.store.set(`containerPosition${id}`, POSITION_OUT_OF_VIEW);
      this.store.set(`containerSticky${id}`, null);
    }

    for (const binding of changed) {
      this.store.set(`containerItemKey${binding.id}`, binding.key);
      this.store.set(`containerItemIndex${binding.id}`, binding.index);
      this.store.set(
        `containerItemData${binding.id}`,
        this.props.data[binding.index],
      );
    }

    for (const request of requests) {
      const id = this.pool.getContainerByKey(request.key);

      if (id === undefined) continue;

      const position = this.metrics.getPosition(request.index);
      const previousPosition = this.store.peek(`containerPosition${id}`);

      if (previousPosition !== undefined && previousPosition !== position) {
        listDebug("position", "контейнер сместился", {
          id,
          index: request.index,
          key: request.key,
          from: previousPosition,
          to: position,
          delta: position - previousPosition,
        });
      }

      this.store.set(`containerPosition${id}`, position);
      this.store.set(
        `containerItemSize${id}`,
        this.metrics.getSize(request.index),
      );
      this.store.set(`containerSticky${id}`, request.stickyEdge);
      this.store.set(
        `containerStickyLimit${id}`,
        request.stickyEdge ? this.sticky.getLimitOf(request.index) : undefined,
      );
      this.store.notifyPosition(request.key, position);
    }

    this.store.set("numContainers", count);
  }

  /** Снятие таймеров и подписок при размонтировании списка. */
  dispose(): void {
    this.viewability.dispose();
  }

  private releaseAll(): void {
    const { released, count } = this.pool.allocate([]);

    for (const id of released) {
      this.store.set(`containerPosition${id}`, POSITION_OUT_OF_VIEW);
    }

    this.store.set("numContainers", count);
  }
}
