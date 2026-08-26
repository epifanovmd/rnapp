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
import { MaintainVisibleContentPosition } from "./mvcp";
import { ScrollVelocityTracker } from "./scroll-velocity";
import { StickyAnchors } from "./sticky-anchors";
import { ViewabilityTracker } from "./viewability";

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
/** Сколько ждать измерений перед первым показом списка, мс. */
const READY_FALLBACK_MS = 150;

/**
 * Округление раскладки перед записью в сигналы.
 *
 * Префиксные суммы пересчитываются с разного «грязного» индекса и дают
 * результат, различающийся в последних битах float. Стор сравнивает значения,
 * и такая разница заставляла перерисовываться каждый контейнер на каждом
 * измерении — при том, что на экране не двигалось ничего.
 */
const roundLayout = (value: number): number => Math.round(value * 100) / 100;

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
  private readonly mvcp: MaintainVisibleContentPosition;
  private readonly sticky: StickyAnchors;
  private readonly viewability: ViewabilityTracker<TItem>;

  /** Измерения копятся до конца кадра и применяются одним проходом. */
  private pendingFlush = false;

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
  /** Ключи, о повторе которых уже сообщено. */
  private readonly reportedDuplicates = new Set<string>();
  /** Насколько контент выше суммы элементов: шапка, подвал, распорки. */
  private contentPadding = 0;
  /** Страховка первого показа, если измерения так и не пришли. */
  private readyTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor(store: ListStore, props: IListRuntimeProps<TItem>) {
    this.store = store;
    this.props = props;
    this.metrics = new ListMetrics({
      estimatedItemSize: props.estimatedItemSize,
    });

    this.edges = new EdgeThresholds(this.edgeOptions());
    this.maintainAtEnd = new MaintainScrollAtEnd(this.maintainOptions());
    this.mvcp = new MaintainVisibleContentPosition({
      store,
      metrics: this.metrics,
      adapter: () => this.adapter,
      getScroll: () => this.scroll,
      getScrollLength: () => this.scrollLength,
      getContentSize: () => this.getContentSize(),
      shouldRestorePosition: index =>
        this.props.shouldRestorePosition?.(index) ?? true,
    });
    this.sticky = new StickyAnchors({ metrics: this.metrics });
    this.sticky.setConfigs(props.sticky);
    this.viewability = new ViewabilityTracker<TItem>({
      metrics: this.metrics,
      getItem: index => this.props.data[index],
    });
    this.viewability.setPairs(props.viewabilityPairs);

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

  /**
   * Фактическая высота контента ScrollView.
   *
   * Из неё вычисляется граница скролла, а к ней ScrollView сам подтягивает
   * смещение при укорачивании контента. Сумма элементов эту высоту не
   * покрывает: сверху и снизу лежат шапка, подвал и распорки, о размерах
   * которых список не знает. Их суммарный вклад берётся из замера и держится
   * между обновлениями данных — меняется он куда реже, чем сами элементы.
   */
  setContentSize(height: number): void {
    if (this.pendingFlush) return;

    const padding = height - this.metrics.getTotalSize();

    if (padding < 0) return;

    this.contentPadding = padding;
  }

  private getContentSize(): number {
    return this.metrics.getTotalSize() + this.contentPadding;
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
    if (props.maintainVisibleContentPositionData) this.mvcp.capture("данные");

    this.applyData(props.data);

    if (props.maintainVisibleContentPositionData) {
      this.restoreVisiblePosition("данные");
    } else {
      this.calculateItemsInView();
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
    const seen = __DEV__ ? new Set<string>() : undefined;

    this.keys = new Array<string>(data.length);
    this.types = new Array<string>(data.length);

    for (let index = 0; index < data.length; index++) {
      const item = data[index]!;
      const key = keyExtractor(item, index);
      const type = getItemType?.(item, index) ?? DEFAULT_ITEM_TYPE;

      if (seen) {
        if (seen.has(key)) this.warnDuplicateKey(key, index);
        seen.add(key);
      }

      this.keys[index] = key;
      this.types[index] = type;

      const fixedSize = getFixedItemSize?.(item, index, type);

      if (fixedSize !== undefined) this.metrics.setFixedSize(key, fixedSize);
    }

    this.metrics.setItems(this.keys, this.types);
  }

  /**
   * Повтор ключа в данных.
   *
   * Размеры, позиции и контейнеры адресуются ключом, поэтому два элемента с
   * одним ключом делят одну ячейку: она отрисовывается на месте первого из них,
   * на месте второго остаётся дыра. Сообщается один раз на ключ — иначе вывод
   * забьётся повтором на каждом обновлении данных.
   */
  private warnDuplicateKey(key: string, index: number): void {
    if (this.reportedDuplicates.has(key)) return;

    this.reportedDuplicates.add(key);
    console.warn(
      `[List] keyExtractor вернул повторяющийся ключ "${key}" на индексе ${index}. ` +
        "Элементы с одинаковым ключом делят контейнер: второй не отрисуется.",
    );
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
    this.revealWhenMeasured();
    this.scheduleReadyFallback();
  }

  /**
   * Первый показ списка.
   *
   * До измерений позиции оценочные, и строки с непохожей высотой налезают друг
   * на друга. Показывать такой кадр нельзя: он и есть та самая каша при
   * открытии. Список раскрывается, когда видимые строки измерены — или когда их
   * размеры объявлены пропом и измерять нечего.
   */
  private revealWhenMeasured(): void {
    if (!this.initialScroll.isActive() || this.props.initialScroll) return;
    if (this.keys.length !== 0 && !this.isVisibleRangeMeasured()) return;

    this.initialScroll.finish();
  }

  private isVisibleRangeMeasured(): boolean {
    if (this.range.end < this.range.start) return false;

    for (let index = this.range.start; index <= this.range.end; index++) {
      const key = this.keys[index];

      if (key === undefined || !this.metrics.hasMeasured(key)) return false;
    }

    return true;
  }

  /**
   * Страховка на случай, когда измерений не будет вовсе: пустые данные,
   * нулевая высота ячейки. Ждать их бесконечно — значит не показать список.
   */
  private scheduleReadyFallback(): void {
    if (this.readyTimeout || !this.initialScroll.isActive()) return;

    this.readyTimeout = setTimeout(() => {
      this.readyTimeout = undefined;
      this.initialScroll.finish();
    }, READY_FALLBACK_MS);
  }

  /** Новое смещение скролла. */
  setScroll(offset: number): void {
    // Событие отправлено до применения компенсации: его смещение уже устарело,
    // и принять его — значит откатить только что сделанный сдвиг.
    if (this.mvcp.isStaleScroll(offset)) return;

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
          this.mvcp.isSettling() ||
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
   * снимается до применения первого размера — по старой раскладке, — поэтому
   * измерение, которое ничего не двигает, отсеивается заранее: иначе якорь
   * остался бы снятым без пересчёта, который его вернёт.
   *
   * Ключ приходит вместе с высотой и от привязки контейнера не зависит: она
   * измерена на содержимом, отрисованном именно для этого ключа. Событие
   * доставляется в JS асинхронно и вполне может застать контейнер уже под
   * другим элементом — отбрасывать такое измерение нельзя, иначе элемент
   * навсегда останется с оценочным размером, а соседи наползут друг на друга.
   */
  setItemSize(key: string, size: number): void {
    if (!this.metrics.willResize(key, size)) return;

    if (this.props.maintainVisibleContentPositionSize) {
      this.mvcp.capture("размер");
    }

    const previous = this.metrics.getSizeByKey(key);

    this.metrics.setMeasuredSize(key, size);

    listDebug("size", "измерено", {
      key,
      from: previous ?? -1,
      to: size,
      delta: size - (previous ?? size),
    });

    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.pendingFlush) return;

    this.pendingFlush = true;
    requestAnimationFrame(() => this.flushLayout());
  }

  /** Применение накопленных изменений раскладки одним проходом. */
  private flushLayout(): void {
    this.pendingFlush = false;

    if (this.props.maintainVisibleContentPositionSize) {
      this.restoreVisiblePosition("размер");
    } else {
      this.calculateItemsInView();
    }

    this.updateAlignItemsAtEndPadding();
    this.updateAnchoredEndSpace();
    this.checkThresholds();
    this.initialScroll.apply();
    this.revealWhenMeasured();

    if (this.didLayout) this.maintainAtEnd.run();
  }

  /**
   * Удержание видимой позиции после изменения раскладки.
   *
   * Сдвиг выполняет нативный ScrollView — он делает это в той же
   * mount-транзакции, что и перестановку контейнеров, поэтому промежуточного
   * кадра не возникает. Здесь только приводится внутреннее представление о
   * смещении, чтобы диапазон отрисовки не отставал до прихода события скролла.
   *
   * Вызов обязан идти в том же синхронном проходе, что и запись позиций: React
   * сведёт все сигналы в один рендер, а нативный слой — в одну транзакцию.
   * Разнести их по кадрам — значит увидеть прыжок.
   *
   * Раскладка считается дважды, и оба прохода обязательны. Первый нужен ради
   * привязки контейнеров: она уточняет размеры новых элементов по высоте тех,
   * чьё место они заняли, — а от размеров зависит, на сколько уехал якорь.
   * Посчитать сдвиг раньше значит посчитать его по устаревшим позициям.
   *
   * Идёт первый проход по предсказанному смещению: иначе он промахнулся бы
   * диапазоном ровно на величину будущего сдвига и перепривязал бы контейнеры
   * впустую. Предсказание расходится с итогом лишь на то, что уточнит сам этот
   * проход, — на единицы пикселей.
   */
  private restoreVisiblePosition(reason: string): void {
    const scroll = this.scroll;

    this.scroll = scroll + this.mvcp.peekShift();
    this.calculateItemsInView();

    // Сдвиг считается от настоящего смещения, а не от предсказанного.
    this.scroll = scroll;
    this.scroll = this.mvcp.restore(reason);
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
    const viewportTop = this.scroll;
    const viewportEnd = viewportTop + this.scrollLength;
    const pinned = this.resolveSticky();
    const requests: IContainerRequest[] = [];
    const requested = new Set<number>();
    const requestedKeys = new Set<string>();

    const addRequest = (index: number) => {
      const key = this.keys[index];

      if (key === undefined || requested.has(index)) return;
      // Ключ уже запрошен на другом индексе: контейнер у него один, и попытка
      // разложить его дважды кончилась бы перестановкой позиции на каждом
      // проходе. Место достаётся первому — повтор в данных уже отмечен в логе.
      if (requestedKeys.has(key)) return;

      requested.add(index);
      requestedKeys.add(key);
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

    const { released, count } = this.pool.allocate(requests);

    // Освобождённый контейнер мог тут же уйти под другой элемент — уводить за
    // пределы вьюпорта нужно только те, что остались без привязки.
    for (const id of released) {
      if (this.pool.getBinding(id) !== undefined) continue;

      this.store.set(`containerPosition${id}`, POSITION_OUT_OF_VIEW);
      this.store.set(`containerSticky${id}`, null);
    }

    // Сигналы пишутся для всех запрошенных элементов, а не только для сменивших
    // привязку: элемент может остаться на своём месте с новым объектом данных —
    // так приходит правка сообщения, — и ячейка обязана его увидеть. Стор
    // сравнивает значения по ссылке, поэтому лишних перерисовок это не даёт.
    for (const request of requests) {
      const id = this.pool.getContainerByKey(request.key);

      if (id === undefined) continue;

      const position = roundLayout(this.metrics.getPosition(request.index));
      const size = roundLayout(this.metrics.getSize(request.index));
      // Настоящая высота строки известна только после отрисовки. До неё в
      // метриках лежит оценка, а у строки со сменившимся содержимым — прежний
      // размер: и то и другое расходится с тем, чем строка нарисуется. Ровно на
      // этот кадр она занимает не своё место и налезает на соседей — вставленная
      // сверху пятёрка или строка, выросшая за пределами вида, своим низом
      // въезжает в кадр поверх видимых.
      //
      // Пока строка вне вида, содержимое подрезается по отведённому месту:
      // показывать там нечего, а въехать в кадр она больше не может. Подтверждён
      // размер или нет — неважно: устареть может и подтверждённый.
      //
      // Строку в кадре не подрезаем никогда: обрезанное содержимое заметнее
      // любого наползания, и тень или выступающий элемент рисуются за её
      // границами законно.
      //
      // Прилипающие исключены целиком — они за своими границами и живут: аватар
      // группы держится у кромки, когда сама группа уже ушла вверх.
      const clipped =
        request.stickyEdge === null &&
        (position + size <= viewportTop || position >= viewportEnd);
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

      this.store.set(`containerClipped${id}`, clipped);
      this.store.set(`containerItemKey${id}`, request.key);
      this.store.set(`containerItemIndex${id}`, request.index);
      this.store.set(`containerItemData${id}`, this.props.data[request.index]);
      this.store.set(`containerPosition${id}`, position);
      this.store.set(`containerItemSize${id}`, size);
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
    this.mvcp.reset();

    if (this.readyTimeout) clearTimeout(this.readyTimeout);

    this.readyTimeout = undefined;
  }

  private releaseAll(): void {
    const { released, count } = this.pool.allocate([]);

    for (const id of released) {
      this.store.set(`containerPosition${id}`, POSITION_OUT_OF_VIEW);
    }

    this.store.set("numContainers", count);
  }
}
