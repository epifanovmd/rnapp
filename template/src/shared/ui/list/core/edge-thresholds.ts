import type { ListStore } from "../model";

/** Кромка списка. */
export type ListEdge = "start" | "end";

/** Состояние, при котором кромка уже была объявлена достигнутой. */
interface IEdgeSnapshot {
  atEdge: boolean;
  contentSize: number;
  dataLength: number;
}

interface IEdgeLatch {
  reached: boolean;
  snapshot?: IEdgeSnapshot;
}

/** Условия одной проверки порогов. */
export interface IEdgeCheckContext {
  scroll: number;
  scrollLength: number;
  contentSize: number;
  dataLength: number;
  /** Отступ у конца контента, не считающийся расстоянием до кромки. */
  contentInsetEnd: number;
  /** Идёт начальный или программный скролл — пороги не трогаем. */
  skipCallbacks: boolean;
}

export interface IEdgeThresholdsOptions {
  store: ListStore;
  /** Доли длины вьюпорта. */
  startThreshold: number;
  endThreshold: number;
  /** Порог, в пределах которого список считается прижатым к концу. */
  maintainScrollAtEndThreshold: number;
  onStartReached?: (info: { distanceFromStart: number }) => void;
  onEndReached?: (info: { distanceFromEnd: number }) => void;
}

/** Расстояние, в пределах которого кромка считается достигнутой точно. */
const EDGE_EPSILON = 1;
/** Выход за порог засчитывается с запасом — иначе колбэк дребезжит у границы. */
const HYSTERESIS = 1.3;

/**
 * Пороги достижения начала и конца списка.
 *
 * Колбэк кромки срабатывает один раз на вход в пороговую зону. Повторный вызов
 * возможен, только если список реально изменился (выросли данные или контент)
 * либо пользователь вышел за порог с запасом и вернулся.
 *
 * Гейт держит кромки общими: после срабатывания одной вторая молчит до нового
 * жеста, а направление жеста решает, какая из них разблокируется. Иначе
 * подгрузка вверх и вниз выстреливают одновременно на коротком контенте.
 */
export class EdgeThresholds {
  private options: IEdgeThresholdsOptions;

  private startLatch: IEdgeLatch = { reached: false };
  private endLatch: IEdgeLatch = { reached: false };
  private gate: "closed" | "prepared" | undefined;

  constructor(options: IEdgeThresholdsOptions) {
    this.options = options;
  }

  setOptions(options: IEdgeThresholdsOptions): void {
    this.options = options;
  }

  /** Жест завершён: следующий позволит кромке сработать снова. */
  prepareForNextGesture(): void {
    if (this.gate) this.gate = "prepared";
  }

  /** Начало жеста; направление решает, какая кромка разблокируется. */
  beginGesture(scrollDelta: number): ListEdge | undefined {
    if (this.gate !== "prepared") return undefined;

    const allowedEdge: ListEdge = scrollDelta < 0 ? "start" : "end";

    this.gate = "closed";
    this.resetLatch(allowedEdge);

    return allowedEdge;
  }

  private resetLatch(edge: ListEdge): void {
    if (edge === "start") {
      this.startLatch = { reached: false };
    } else {
      this.endLatch = { reached: false };
    }
  }

  check(context: IEdgeCheckContext, allowedEdge?: ListEdge): void {
    const gateWasOpen = !this.gate;

    this.resetGateIfOutside(context);
    this.checkEnd(context, allowedEdge, gateWasOpen);
    this.checkStart(context, allowedEdge, gateWasOpen);
  }

  /** Оба конца далеко за порогами — общий гейт больше никого не держит. */
  private resetGateIfOutside(context: IEdgeCheckContext): void {
    if (!this.gate) return;

    const { scroll, scrollLength, contentSize, contentInsetEnd } = context;
    const distanceFromEnd =
      contentSize - scroll - scrollLength - contentInsetEnd;
    const isContentShorter = contentSize < scrollLength;

    const outsideStart = this.isOutside(
      scroll,
      false,
      this.options.startThreshold * scrollLength,
    );
    const outsideEnd = this.isOutside(
      distanceFromEnd,
      isContentShorter,
      this.options.endThreshold * scrollLength,
    );

    if (outsideStart && outsideEnd) this.gate = undefined;
  }

  private isOutside(
    distance: number,
    atEdge: boolean,
    threshold: number,
  ): boolean {
    if (atEdge) return false;

    const absolute = Math.abs(distance);

    return threshold > 0 ? absolute >= threshold * HYSTERESIS : absolute > 0;
  }

  private checkEnd(
    context: IEdgeCheckContext,
    allowedEdge: ListEdge | undefined,
    gateWasOpen: boolean,
  ): void {
    const { scroll, scrollLength, contentSize, contentInsetEnd, dataLength } =
      context;

    if (contentSize <= 0) return;

    const distanceFromEnd =
      contentSize - scroll - scrollLength - contentInsetEnd;
    const isContentShorter = contentSize < scrollLength;
    const { store, endThreshold, maintainScrollAtEndThreshold } = this.options;

    store.set("isAtEnd", isContentShorter || distanceFromEnd <= EDGE_EPSILON);
    store.set(
      "isNearEnd",
      isContentShorter || distanceFromEnd <= endThreshold * scrollLength,
    );
    store.set(
      "isWithinMaintainScrollAtEndThreshold",
      isContentShorter ||
        distanceFromEnd <= maintainScrollAtEndThreshold * scrollLength,
    );

    if (context.skipCallbacks) return;

    this.endLatch = this.evaluate(
      this.endLatch,
      distanceFromEnd,
      isContentShorter,
      endThreshold * scrollLength,
      { contentSize, dataLength },
      distance => {
        if (!this.canDispatch("end", allowedEdge, gateWasOpen)) return;

        this.gate = "closed";
        this.options.onEndReached?.({ distanceFromEnd: distance });
      },
    );
  }

  private checkStart(
    context: IEdgeCheckContext,
    allowedEdge: ListEdge | undefined,
    gateWasOpen: boolean,
  ): void {
    const { scroll, scrollLength, contentSize, dataLength } = context;
    const { store, startThreshold } = this.options;
    const threshold = startThreshold * scrollLength;

    store.set("isAtStart", scroll <= EDGE_EPSILON);
    store.set("isNearStart", scroll <= threshold);

    // Список вырос выше текущей позиции — прежнее «начало достигнуто» устарело.
    const snapshot = this.startLatch.snapshot;
    const contentGrew =
      snapshot !== undefined &&
      (snapshot.contentSize !== contentSize ||
        snapshot.dataLength !== dataLength);

    if (
      this.startLatch.reached &&
      threshold > 0 &&
      scroll > threshold &&
      contentGrew
    ) {
      this.startLatch = { reached: false };
    }

    if (context.skipCallbacks) return;

    this.startLatch = this.evaluate(
      this.startLatch,
      scroll,
      false,
      threshold,
      { contentSize, dataLength },
      distance => {
        if (!this.canDispatch("start", allowedEdge, gateWasOpen)) return;

        this.gate = "closed";
        this.options.onStartReached?.({ distanceFromStart: distance });
      },
    );
  }

  private canDispatch(
    edge: ListEdge,
    allowedEdge: ListEdge | undefined,
    gateWasOpen: boolean,
  ): boolean {
    return !this.gate || allowedEdge === edge || gateWasOpen;
  }

  /**
   * Состояние защёлки кромки: вход в пороговую зону вызывает колбэк один раз,
   * выход за порог с запасом снимает защёлку.
   */
  private evaluate(
    latch: IEdgeLatch,
    distance: number,
    atEdge: boolean,
    threshold: number,
    context: { contentSize: number; dataLength: number },
    onReached: (distance: number) => void,
  ): IEdgeLatch {
    const within = atEdge || (threshold > 0 && Math.abs(distance) <= threshold);
    const snapshot: IEdgeSnapshot = { atEdge, ...context };

    if (!latch.reached) {
      if (!within) return latch;

      onReached(distance);

      return { reached: true, snapshot };
    }

    if (this.isOutside(distance, atEdge, threshold)) return { reached: false };

    if (within) {
      const previous = latch.snapshot;
      const changed =
        !previous ||
        previous.atEdge !== atEdge ||
        previous.contentSize !== context.contentSize ||
        previous.dataLength !== context.dataLength;

      if (changed) return { reached: true, snapshot };
    }

    return latch;
  }
}
