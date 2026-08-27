import { ContainerPool, ListMetrics, ListStore } from "../../model";
import { ItemSource } from "../data";
import type { IEdgeCheckContext, ListEdge } from "../edges";
import { EdgeThresholds } from "../edges";
import type { IListRange } from "../layout";
import {
  AlignItemsAtEnd,
  AnchoredEndSpace,
  collectContainerRequests,
  computeVisibleRange,
  ContainerBinder,
  ContentSize,
  EMPTY_RANGE,
  LayoutScheduler,
  RenderReadiness,
} from "../layout";
import { listDebug } from "../list-debug";
import { MaintainVisibleContentPosition } from "../mvcp";
import type { IScrollAdapter } from "../scroll";
import {
  getItemScrollOffset,
  InitialOffsetResolver,
  InitialScroll,
  MaintainScrollAtEnd,
  ProgrammaticScroll,
  ScrollVelocityTracker,
} from "../scroll";
import { StickyAnchors, StickyPublisher } from "../sticky";
import { ViewabilityTracker } from "../viewability";
import type { IListRuntimeProps } from "./runtime-props";

/**
 * Расчётное ядро списка.
 *
 * Зачем нужно: диапазон отрисовки, позиции и привязка контейнеров считаются
 * здесь, вне React. В дерево уходят только адресные сигналы стора, поэтому
 * скролл и измерения не перерисовывают список целиком — перерисовывается только
 * затронутый контейнер.
 *
 * Что делает сам: почти ничего. Ядро — координатор: оно держит смещение,
 * размер вьюпорта и текущий диапазон, а всю содержательную работу делают
 * отдельные части. Здесь живёт только то, что связывает их между собой, —
 * порядок вызовов, от которого зависит, увидит пользователь прыжок или нет.
 *
 * Ключевые связки, каждая из которых была отдельной проблемой:
 * - {@link setProps} снимает якорь **до** смены данных и восстанавливает
 *   позицию **после**: якорь обязан помнить раскладку до изменения;
 * - {@link setItemSize} копит измерения до конца кадра, но якорь снимает сразу
 *   — база компенсации должна относиться к состоянию до первого изменения пачки;
 * - {@link restoreVisiblePosition} считает раскладку дважды и в одном
 *   синхронном проходе с записью позиций;
 * - {@link setScroll} отбрасывает события, отправленные до применения сдвига.
 */
export class ListRuntime<TItem> {
  readonly store: ListStore;
  readonly metrics: ListMetrics;
  readonly pool = new ContainerPool();

  private props: IListRuntimeProps<TItem>;
  private readonly items: ItemSource<TItem>;

  /**
   * Смещение скролла в координатах раскладки элементов.
   *
   * Не то же, что `contentOffset`: над элементами лежит шапка, и нативное
   * смещение больше на её высоту. Внутри всё считается в координатах элементов
   * — с ними сравниваются позиции строк; наружу отдаётся `contentOffset`.
   */
  private scroll = 0;
  /** Размер вьюпорта вдоль оси скролла. */
  private scrollLength = 0;
  private range: IListRange = { ...EMPTY_RANGE };

  private readonly velocity = new ScrollVelocityTracker();
  private readonly edges: EdgeThresholds;
  private readonly maintainAtEnd: MaintainScrollAtEnd;
  private readonly mvcp: MaintainVisibleContentPosition;
  private readonly sticky: StickyAnchors;
  private readonly stickyPublisher: StickyPublisher;
  private readonly viewability: ViewabilityTracker<TItem>;
  private readonly binder: ContainerBinder;
  private readonly scheduler: LayoutScheduler;
  private readonly contentSize: ContentSize;
  private readonly alignAtEnd: AlignItemsAtEnd;
  private readonly endSpace: AnchoredEndSpace;
  private readonly readiness: RenderReadiness;
  private readonly initialOffset: InitialOffsetResolver;
  private readonly initialScroll: InitialScroll;
  private readonly programmatic: ProgrammaticScroll;

  private adapter: IScrollAdapter | undefined;
  /** Кромка, разблокированная текущим жестом. */
  private allowedEdge: ListEdge | undefined;
  /** Контейнеры уже прошли первую раскладку — до этого прилипать не к чему. */
  private didLayout = false;

  constructor(store: ListStore, props: IListRuntimeProps<TItem>) {
    this.store = store;
    this.props = props;
    this.metrics = new ListMetrics({
      estimatedItemSize: props.estimatedItemSize,
    });

    const adapter = () => this.adapter;

    this.items = new ItemSource({ metrics: this.metrics });
    this.scheduler = new LayoutScheduler(() => this.flushLayout());
    this.contentSize = new ContentSize({
      metrics: this.metrics,
      isFlushPending: () => this.scheduler.isPending(),
    });

    this.edges = new EdgeThresholds(this.edgeOptions());
    this.maintainAtEnd = new MaintainScrollAtEnd(this.maintainOptions());
    this.programmatic = new ProgrammaticScroll({ adapter });

    this.mvcp = new MaintainVisibleContentPosition({
      store,
      metrics: this.metrics,
      adapter,
      getScroll: () => this.scroll,
      getScrollLength: () => this.scrollLength,
      // В координатах элементов, как и смещение выше: иначе граница скролла,
      // посчитанная из этой высоты, разъедется со смещением на высоту шапки.
      getContentSize: () => this.contentSize.get() - this.getContentOrigin(),
      shouldRestorePosition: index =>
        this.props.shouldRestorePosition?.(index) ?? true,
    });

    this.sticky = new StickyAnchors({ metrics: this.metrics });
    this.sticky.setConfigs(props.sticky);
    this.stickyPublisher = new StickyPublisher({ store, anchors: this.sticky });

    this.viewability = new ViewabilityTracker<TItem>({
      metrics: this.metrics,
      getItem: index => this.props.data[index],
    });
    this.viewability.setPairs(props.viewabilityPairs);

    this.binder = new ContainerBinder({
      store,
      metrics: this.metrics,
      pool: this.pool,
      getItem: index => this.props.data[index],
      getStickyLimit: index => this.sticky.getLimitOf(index),
    });

    this.alignAtEnd = new AlignItemsAtEnd({
      store,
      metrics: this.metrics,
      isEnabled: () => this.props.alignItemsAtEnd,
      getScrollLength: () => this.scrollLength,
    });
    this.endSpace = new AnchoredEndSpace({
      store,
      metrics: this.metrics,
      getConfig: () => this.props.anchoredEndSpace,
      getScrollLength: () => this.scrollLength,
    });

    this.initialOffset = new InitialOffsetResolver({
      metrics: this.metrics,
      getTarget: () => this.props.initialScroll,
      getScrollLength: () => this.scrollLength,
      getContentSize: () => this.contentSize.get(),
      getContentOrigin: () => this.getContentOrigin(),
    });
    this.initialScroll = new InitialScroll({
      target: props.initialScroll,
      resolveOffset: () => this.initialOffset.resolve(),
      scrollToOffset: offset => this.adapter?.scrollToOffset(offset, false),
      isTargetSettled: () => this.initialOffset.isSettled(),
      onFinished: () => {
        this.store.set("readyToRender", true);
        this.props.onLoad?.();
      },
    });
    this.readiness = new RenderReadiness({
      metrics: this.metrics,
      getRange: () => this.range,
      getCount: () => this.items.getCount(),
      hasInitialTarget: () => this.props.initialScroll !== undefined,
      isPending: () => this.initialScroll.isActive(),
      finish: () => this.initialScroll.finish(),
    });

    this.items.apply(props.data, props);
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

  /** Смещение скролла в координатах контента — то же, что у нативного. */
  getScroll(): number {
    return this.scroll + this.getContentOrigin();
  }

  getScrollLength(): number {
    return this.scrollLength;
  }

  getVelocity(): number {
    return this.velocity.get();
  }

  /** Полная высота контента: элементы плюс шапка, подвал и распорки. */
  getContentSize(): number {
    return this.contentSize.get();
  }

  /** Замер высоты контента от ScrollView. */
  setContentSize(height: number): void {
    this.contentSize.setMeasured(height);
    this.publishGeometry();
  }

  /**
   * Замер шапки списка.
   *
   * Шапка задаёт начало координат элементов. Пока она не измерена, список
   * считает её нулевой; с приходом замера нативное смещение не меняется —
   * сдвигается начало отсчёта, и раскладку нужно пересчитать.
   */
  setHeaderSize(size: number): void {
    const delta = size - this.getContentOrigin();

    this.store.set("headerSize", size);

    if (delta === 0) return;

    this.scroll -= delta;
    this.calculateItemsInView();
    this.checkThresholds();
  }

  /** Замер подвала списка. */
  setFooterSize(size: number): void {
    this.store.set("footerSize", size);
  }

  /**
   * Замер вьюпорта целиком.
   *
   * Вдоль оси скролла размер приходит отдельно ({@link setScrollLength}) — он
   * участвует в расчётах; ширина нужна только тем, кто строит поверх списка
   * собственную раскладку.
   */
  setScrollSize(width: number, height: number): void {
    const previous = this.store.peek("scrollSize");

    if (previous?.width === width && previous.height === height) return;

    this.store.set("scrollSize", { width, height });
  }

  /**
   * Обновление пропов между рендерами.
   *
   * Смена данных — единственный случай, требующий полного прохода. Якорь
   * снимается до неё, по позициям старой раскладки, и восстанавливается сразу
   * после: разнести это по кадрам значит показать промежуточное состояние.
   */
  setProps(props: IListRuntimeProps<TItem>): void {
    const dataChanged = props.data !== this.props.data;

    this.props = props;
    this.edges.setOptions(this.edgeOptions());
    this.maintainAtEnd.setOptions(this.maintainOptions());
    this.sticky.setConfigs(props.sticky);
    this.viewability.setPairs(props.viewabilityPairs);

    if (!dataChanged) return;

    if (props.maintainVisibleContentPositionData) this.mvcp.capture("данные");

    this.items.apply(props.data, props);

    if (props.maintainVisibleContentPositionData) {
      this.restoreVisiblePosition("данные");
    } else {
      this.calculateItemsInView();
    }

    this.alignAtEnd.update();
    this.endSpace.update();
    this.checkThresholds();

    // Новый контент удлинил список: если пользователь стоял у конца, держим его там.
    if (this.didLayout) this.maintainAtEnd.run();
  }

  /** Новый размер вьюпорта. */
  setScrollLength(length: number): void {
    if (this.scrollLength === length) return;

    this.scrollLength = length;
    this.store.set("scrollLength", length);
    this.publishGeometry();
    this.calculateItemsInView();
    this.alignAtEnd.update();
    this.endSpace.update();
    this.checkThresholds();
    this.didLayout = true;
    this.initialScroll.apply();
    this.readiness.reveal();
    this.readiness.scheduleFallback();
  }

  /** Новое смещение нативного скролла — `contentOffset`. */
  setScroll(offset: number): void {
    const scroll = offset - this.getContentOrigin();

    // Событие отправлено до применения компенсации: его смещение уже устарело,
    // и принять его — значит откатить только что сделанный сдвиг.
    if (this.mvcp.isStaleScroll(scroll)) return;

    if (this.scroll === scroll) return;

    const previous = this.scroll;

    this.scroll = scroll;
    this.velocity.add(scroll);
    this.store.set("velocity", this.velocity.get());

    listDebug("scroll", "setScroll", {
      from: previous,
      to: scroll,
      delta: scroll - previous,
    });

    this.calculateItemsInView();
    this.checkThresholds();
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

  /**
   * Позиция элемента в координатах контента.
   *
   * Раскладка элементов начинается с нуля, а в контенте над ними лежит шапка:
   * наружу отдаётся позиция с поправкой на неё — та, что годится для скролла.
   */
  getPositionAtIndex(index: number): number | undefined {
    if (index < 0 || index >= this.items.getCount()) return undefined;

    return this.getContentOrigin() + this.metrics.getPosition(index);
  }

  /** Размер элемента; до измерения — оценка, а не факт. */
  getSizeAtIndex(index: number): number | undefined {
    if (index < 0 || index >= this.items.getCount()) return undefined;

    return this.metrics.getSize(index);
  }

  /**
   * Позиция элемента по его ключу.
   *
   * Ключ переживает вставки и удаления, а индекс — нет: после подгрузки сверху
   * тот же элемент лежит на другом индексе.
   */
  getPositionByKey(key: string): number | undefined {
    const position = this.metrics.getPositionByKey(key);

    return position === undefined
      ? undefined
      : this.getContentOrigin() + position;
  }

  getIndexByKey(key: string): number | undefined {
    return this.metrics.getIndexByKey(key);
  }

  scrollToOffset(offset: number, animated = false): void {
    this.programmatic.toOffset(offset, animated);
  }

  scrollToEnd(animated = false): void {
    this.programmatic.toEnd(animated);
  }

  /**
   * Скролл к элементу по ключу; см. {@link getPositionByKey}.
   *
   * @returns false, если элемента с таким ключом в данных нет.
   */
  scrollToKey(params: {
    key: string;
    animated?: boolean;
    viewPosition?: number;
    viewOffset?: number;
  }): boolean {
    const index = this.metrics.getIndexByKey(params.key);

    if (index === undefined) return false;

    this.scrollToIndex({ ...params, index });

    return true;
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
    const { index, animated = false, viewPosition, viewOffset } = params;

    if (index < 0 || index >= this.items.getCount()) return;

    this.scrollToOffset(
      getItemScrollOffset({
        position: this.metrics.getPosition(index),
        size: this.metrics.getSize(index),
        scrollLength: this.scrollLength,
        viewPosition,
        viewOffset,
        origin: this.getContentOrigin(),
      }),
      animated,
    );
  }

  /**
   * Результат измерения ячейки.
   *
   * Измерение, которое ничего не двигает, отсеивается заранее: якорь снимается
   * до применения первого размера, и без этой проверки он остался бы снятым без
   * пересчёта, который его вернёт.
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

    this.scheduler.schedule();
  }

  /**
   * Диапазон отрисовки и привязка контейнеров.
   *
   * Публичный: удержание позиции вызывает его дважды за проход, а компоненты —
   * после того, как список смонтирован.
   */
  calculateItemsInView(): void {
    if (this.items.getCount() === 0) {
      this.range = { ...EMPTY_RANGE };
      this.binder.releaseAll();
      this.store.set("totalSize", 0);
      this.publishVisibleRange();
      this.publishGeometry();

      return;
    }

    this.range = computeVisibleRange({
      metrics: this.metrics,
      scroll: this.scroll,
      scrollLength: this.scrollLength,
      drawDistance: this.props.drawDistance,
    });

    listDebug("range", "диапазон", {
      scroll: this.scroll,
      start: this.range.start,
      end: this.range.end,
      startBuffered: this.range.startBuffered,
      endBuffered: this.range.endBuffered,
      total: this.metrics.getTotalSize(),
    });

    this.bindContainers();
    this.store.set("totalSize", this.metrics.getTotalSize());
    this.publishVisibleRange();
    this.publishGeometry();

    if (this.viewability.hasPairs()) {
      this.viewability.update({
        scroll: this.scroll,
        scrollLength: this.scrollLength,
        startBuffered: this.range.startBuffered,
        endBuffered: this.range.endBuffered,
      });
    }
  }

  /** Снятие таймеров и подписок при размонтировании списка. */
  dispose(): void {
    this.viewability.dispose();
    this.mvcp.reset();
    this.readiness.dispose();
    this.programmatic.dispose();
  }

  /**
   * Смещение начала элементов в координатах контента.
   *
   * Раскладка элементов начинается с нуля, а в контенте над ними лежит шапка.
   * Величина нужна везде, где позиция элемента превращается в `contentOffset`.
   */
  private getContentOrigin(): number {
    return this.store.peek("headerSize") ?? 0;
  }

  /**
   * Геометрия контента наружу.
   *
   * `maxScroll` считается здесь, а не у читателя: граница зависит и от высоты
   * контента, и от вьюпорта, и посчитать её самому значит повторить ту же
   * формулу — и разойтись с той, по которой список сам себя ограничивает.
   */
  private publishGeometry(): void {
    const contentSize = this.contentSize.get();

    this.store.set("contentSize", contentSize);
    this.store.set("maxScroll", Math.max(0, contentSize - this.scrollLength));
  }

  /** Границы видимого диапазона наружу; -1 — ни один элемент не в кадре. */
  private publishVisibleRange(): void {
    const isEmpty = this.range.end < this.range.start;

    this.store.set("firstVisibleIndex", isEmpty ? -1 : this.range.start);
    this.store.set("lastVisibleIndex", isEmpty ? -1 : this.range.end);
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

  /** Применение накопленных изменений раскладки одним проходом. */
  private flushLayout(): void {
    this.metrics.clearPending();

    if (this.props.maintainVisibleContentPositionSize) {
      this.restoreVisiblePosition("размер");
    } else {
      this.calculateItemsInView();
    }

    this.alignAtEnd.update();
    this.endSpace.update();
    this.checkThresholds();
    this.initialScroll.apply();
    this.readiness.reveal();

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

  private checkThresholds(): void {
    // Кромки считаются в координатах контента и по его полной высоте: только
    // так «до конца ноль» означает низ последнего кадра, а не низ последней
    // строки — под ней ещё лежат подвал и распорки.
    const context: IEdgeCheckContext = {
      scroll: this.getScroll(),
      scrollLength: this.scrollLength,
      contentSize: this.contentSize.get(),
      dataLength: this.props.data.length,
      contentInsetEnd: this.store.peek("anchoredEndSpaceSize") ?? 0,
      skipCallbacks:
        this.programmatic.isActive() ||
        this.maintainAtEnd.isActive() ||
        this.mvcp.isSettling() ||
        this.initialScroll.isActive(),
    };

    this.edges.check(context, this.allowedEdge);
  }

  /** Привязка контейнеров к элементам диапазона и раскладка их позиций. */
  private bindContainers(): void {
    const viewportTop = this.scroll;
    const viewportEnd = viewportTop + this.scrollLength;
    const pinned = this.stickyPublisher.resolve(this.scroll, this.scrollLength);

    const requests = collectContainerRequests({
      startBuffered: this.range.startBuffered,
      endBuffered: this.range.endBuffered,
      pinned,
      pending: this.metrics.getPendingIndices(),
      getKey: index => this.items.getKey(index),
      getType: index => this.items.getType(index),
      getStickyEdge: index => this.sticky.getEdgeOf(index),
    });

    this.binder.bind({ requests, viewportTop, viewportEnd });
  }
}
